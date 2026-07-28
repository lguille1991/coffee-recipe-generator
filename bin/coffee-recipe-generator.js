#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const SKILL_NAME = "coffee-recipe-generator";
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILL_SOURCE = path.join(PACKAGE_ROOT, SKILL_NAME);
const PACKAGE_JSON = require("../package.json");

function usage() {
  console.log(`Usage: coffee-recipe-generator <command> [options]

Commands:
  install             Install the coffee-recipe-generator skill
  status              Report install status and drift for standard skill locations
  version             Print the package version
  help                Show this help

Install options:
  --target opencode   Install to ~/.agents/skills only
  --target claude     Install to ~/.claude/skills only
  --target all        Install to both standard locations (default)
  --path DIR          Install to a custom skills root directory
  --force             Replace an existing installed skill
  -h, --help          Show this help

Status accepts --target and --path (but not --force) to check a single
location, and reports whether the install matches the packaged skill.

The installer copies the packaged skill directory. It refuses to overwrite an
existing file, directory, or symlink unless --force is provided.`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function homePath(...parts) {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) {
    fail("Could not determine the user's home directory.");
  }
  return path.join(home, ...parts);
}

function parseOptions(args) {
  const options = {
    target: "all",
    customRoot: "",
    force: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--target") {
      const value = args[index + 1];
      if (!value) {
        fail("Missing value for --target.");
      }
      options.target = value;
      index += 1;
    } else if (arg === "--path") {
      const value = args[index + 1];
      if (!value) {
        fail("Missing value for --path.");
      }
      options.customRoot = path.resolve(value);
      index += 1;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      fail(`Unknown option: ${arg}`);
    }
  }

  if (!["opencode", "claude", "all"].includes(options.target)) {
    fail(`Invalid --target value: ${options.target}\nExpected one of: opencode, claude, all`);
  }

  if (options.customRoot && options.target !== "all") {
    fail("Use either --path or --target, not both.");
  }

  return options;
}

function assertSkillSource() {
  const skillFile = path.join(SKILL_SOURCE, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    fail(`Expected skill file not found: ${skillFile}`);
  }
}

function removeExisting(targetPath) {
  fs.rmSync(targetPath, { force: true, recursive: true });
}

function copySkill(targetPath) {
  fs.cpSync(SKILL_SOURCE, targetPath, {
    recursive: true,
    dereference: false,
    errorOnExist: true
  });
}

function installIntoRoot(root, label, force) {
  const installRoot = path.resolve(root);
  const targetPath = path.join(installRoot, SKILL_NAME);

  fs.mkdirSync(installRoot, { recursive: true });

  if (fs.existsSync(targetPath) || fs.lstatSync(targetPath, { throwIfNoEntry: false })?.isSymbolicLink()) {
    if (!force) {
      fail(`${label}: ${targetPath} already exists.\nRun with --force to replace it.`);
    }
    removeExisting(targetPath);
  }

  copySkill(targetPath);
  console.log(`${label}: installed -> ${targetPath}`);
}

function install(args) {
  assertSkillSource();
  const options = parseOptions(args);

  if (options.customRoot) {
    installIntoRoot(options.customRoot, "Custom", options.force);
  } else if (options.target === "opencode") {
    installIntoRoot(homePath(".agents", "skills"), "OpenCode", options.force);
  } else if (options.target === "claude") {
    installIntoRoot(homePath(".claude", "skills"), "Claude", options.force);
  } else {
    installIntoRoot(homePath(".agents", "skills"), "OpenCode", options.force);
    installIntoRoot(homePath(".claude", "skills"), "Claude", options.force);
  }

  console.log(`Installed ${SKILL_NAME}. Run npm update and reinstall with --force to update copied installs.`);
}

function listFiles(root) {
  const entries = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        entries.push(path.relative(root, full));
      }
    }
  };
  walk(root);
  return entries.sort();
}

function compareSkillDirs(targetPath) {
  const sourceFiles = listFiles(SKILL_SOURCE);
  const targetFiles = listFiles(targetPath);
  const sourceSet = new Set(sourceFiles);
  const targetSet = new Set(targetFiles);

  const missing = sourceFiles.filter((file) => !targetSet.has(file));
  const extra = targetFiles.filter((file) => !sourceSet.has(file));
  const changed = sourceFiles.filter((file) => {
    if (!targetSet.has(file)) {
      return false;
    }
    const sourceContent = fs.readFileSync(path.join(SKILL_SOURCE, file));
    const targetContent = fs.readFileSync(path.join(targetPath, file));
    return !sourceContent.equals(targetContent);
  });

  return { missing, extra, changed };
}

function driftSuffix(targetPath) {
  const { missing, extra, changed } = compareSkillDirs(targetPath);
  if (missing.length === 0 && extra.length === 0 && changed.length === 0) {
    return `in sync with package v${PACKAGE_JSON.version}`;
  }
  const parts = [];
  if (changed.length > 0) {
    parts.push(`${changed.length} changed`);
  }
  if (missing.length > 0) {
    parts.push(`${missing.length} missing`);
  }
  if (extra.length > 0) {
    parts.push(`${extra.length} extra`);
  }
  return `drifted from package v${PACKAGE_JSON.version} (${parts.join(", ")}); run \`install --force\` to update`;
}

function statusForRoot(root, label) {
  const targetPath = path.join(root, SKILL_NAME);
  const stat = fs.lstatSync(targetPath, { throwIfNoEntry: false });

  if (!stat) {
    console.log(`${label}: not installed -> ${targetPath}`);
    return;
  }

  if (stat.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(targetPath);
    const resolved = path.resolve(path.dirname(targetPath), linkTarget);
    if (!fs.existsSync(resolved)) {
      console.log(`${label}: dangling symlink -> ${linkTarget}`);
      return;
    }
    const resolvedStat = fs.statSync(resolved, { throwIfNoEntry: false });
    if (resolvedStat?.isDirectory()) {
      console.log(`${label}: symlink -> ${linkTarget} (${driftSuffix(resolved)})`);
      return;
    }
    console.log(`${label}: symlink -> ${linkTarget}`);
    return;
  }

  if (stat.isDirectory()) {
    console.log(`${label}: installed directory -> ${targetPath} (${driftSuffix(targetPath)})`);
    return;
  }

  console.log(`${label}: existing file -> ${targetPath}`);
}

function status(args) {
  const options = parseOptions(args);
  if (options.customRoot) {
    statusForRoot(options.customRoot, "Custom");
    return;
  }
  if (options.target === "opencode") {
    statusForRoot(homePath(".agents", "skills"), "OpenCode");
    return;
  }
  if (options.target === "claude") {
    statusForRoot(homePath(".claude", "skills"), "Claude");
    return;
  }
  statusForRoot(homePath(".agents", "skills"), "OpenCode");
  statusForRoot(homePath(".claude", "skills"), "Claude");
}

const [command = "help", ...args] = process.argv.slice(2);

if (command === "install") {
  install(args);
} else if (command === "status") {
  status(args);
} else if (command === "version" || command === "--version" || command === "-v") {
  console.log(PACKAGE_JSON.version);
} else if (command === "help" || command === "--help" || command === "-h") {
  usage();
} else {
  fail(`Unknown command: ${command}`);
}
