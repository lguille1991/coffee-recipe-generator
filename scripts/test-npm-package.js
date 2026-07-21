#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repositoryRoot = path.resolve(__dirname, "..");
const packageJson = require(path.join(repositoryRoot, "package.json"));
const skillPath = path.join(repositoryRoot, "coffee-recipe-generator", "SKILL.md");
const cliPath = path.join(repositoryRoot, "bin", "coffee-recipe-generator.js");
const skillText = fs.readFileSync(skillPath, "utf8");
const skillVersion = skillText.match(/^\s*version:\s*["']([^"']+)["']/m)?.[1];

assert.ok(skillVersion, "SKILL.md must declare metadata.version");
assert.equal(
  packageJson.version,
  skillVersion,
  "package.json version must match SKILL.md metadata.version"
);

for (const requiredPath of [
  "README.md",
  "LICENSE",
  "bin/",
  "coffee-recipe-generator/",
  "scripts/test-npm-package.js"
]) {
  assert.ok(packageJson.files.includes(requiredPath), `package.json files must include ${requiredPath}`);
}

const helpResult = spawnSync(process.execPath, [cliPath, "--help"], {
  cwd: repositoryRoot,
  encoding: "utf8"
});
assert.equal(helpResult.status, 0, helpResult.stderr);
assert.match(helpResult.stdout, /Usage: coffee-recipe-generator/);

const versionResult = spawnSync(process.execPath, [cliPath, "--version"], {
  cwd: repositoryRoot,
  encoding: "utf8"
});
assert.equal(versionResult.status, 0, versionResult.stderr);
assert.equal(versionResult.stdout.trim(), packageJson.version);

console.log(`npm package checks passed for ${packageJson.name}@${packageJson.version}`);
