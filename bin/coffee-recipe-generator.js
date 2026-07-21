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
  status              Report install status for standard skill locations
  version             Print the package version
  help                Show this help

Install options:
  --target opencode   Install to ~/.agents/skills only
  --target claude     Install to ~/.claude/skills only
  --target all        Install to both standard locations (default)
  --path DIR          Install to a custom skills root directory
  --force             Replace an existing installed skill
  -h, --help          Show this help

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

function statusForRoot(root, label) {
  const targetPath = path.join(root, SKILL_NAME);
  const stat = fs.lstatSync(targetPath, { throwIfNoEntry: false });

  if (!stat) {
    console.log(`${label}: not installed -> ${targetPath}`);
    return;
  }

  if (stat.isSymbolicLink()) {
    console.log(`${label}: symlink -> ${fs.readlinkSync(targetPath)}`);
    return;
  }

  if (stat.isDirectory()) {
    console.log(`${label}: installed directory -> ${targetPath}`);
    return;
  }

  console.log(`${label}: existing file -> ${targetPath}`);
}

function status() {
  statusForRoot(homePath(".agents", "skills"), "OpenCode");
  statusForRoot(homePath(".claude", "skills"), "Claude");
}

const [command = "help", ...args] = process.argv.slice(2);

if (command === "install") {
  install(args);
} else if (command === "status") {
  status();
} else if (command === "version" || command === "--version" || command === "-v") {
  console.log(PACKAGE_JSON.version);
} else if (command === "help" || command === "--help" || command === "-h") {
  usage();
} else {
  fail(`Unknown command: ${command}`);
}
