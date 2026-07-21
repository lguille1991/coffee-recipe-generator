# Repository Guidelines

## Project Structure & Module Organization

This repository is a small, documentation-first skill package. The root contains `README.md`, install/update helper scripts, and this guide. The main deliverable lives in `coffee-recipe-generator/`:

- `SKILL.md`: the primary skill definition and workflow rules
- `references/`: source material and operating guidance for recipe generation and research
- `templates/`: output scaffolds such as `coffee-profile.md` and `recipe-output.md`
- Root `scripts/`: installer and updater scripts for linking the skill into OpenCode and Claude skill locations

Keep new content close to the skill it supports. For example, add brewing research under `coffee-recipe-generator/references/` and reusable output formats under `coffee-recipe-generator/templates/`.

## Build, Test, and Development Commands

No build pipeline or package manager is configured in this repository. The useful local commands are basic inspection commands:

- `git status`: review pending changes before editing docs or skill files
- `find coffee-recipe-generator -maxdepth 2 -type f | sort`: inspect the current file set
- `cat coffee-recipe-generator/SKILL.md`: review the primary workflow before making changes
- `./scripts/install-skill.sh`: install the skill as symlinks into both OpenCode and Claude locations
- `./scripts/update-skill.sh`: pull the latest repo and report whether standard skill locations point to this clone
- `bash -n scripts/install-skill.sh && bash -n scripts/update-skill.sh`: validate shell syntax after editing install tooling
- `python3 coffee-recipe-generator/scripts/test-validate-recipe-output.py`: run focused regression tests for recipe-output hook routing

If you add tooling later, document the exact commands here and in `README.md`.

## Coding Style & Naming Conventions

Prefer concise Markdown with clear headings and short paragraphs. Match the existing style in `SKILL.md`: imperative instructions, explicit constraints, and ordered workflows. Use lowercase kebab-case for new reference and template filenames, such as `water-quality.md`. Avoid filenames that begin with digits; spell out leading numeric concepts, for example `four-six-method.md`. Keep templates descriptive and task-oriented, for example `espresso-output.md`.

## Testing Guidelines

There is no broad automated test suite today. Run the focused recipe-output validator tests when changing hook behavior, then validate Markdown changes by reading the edited files end to end and checking that:

- internal paths are real
- section ordering is still logical
- templates and references named in `SKILL.md` actually exist

When changing workflow rules, verify examples and required output sections remain consistent with the referenced files.

When changing install tooling, test with `--path` against a temporary directory before touching real user skill locations. Installer scripts must remain non-destructive: do not overwrite real directories or files at skill install paths.

## Versioning Guidelines

Whenever `coffee-recipe-generator/SKILL.md` changes, bump `metadata.version` in its frontmatter using Semantic Versioning:

- Patch, `x.y.Z`: typo fixes, wording clarifications, metadata-only changes, or non-behavioral documentation edits.
- Minor, `x.Y.0`: new workflows, new required or optional parameters, new supported brew methods, new references/templates used by the skill, or backward-compatible behavior changes.
- Major, `X.0.0`: breaking workflow changes, removed behavior, renamed required sections, removed supported methods, or changed required inputs that can invalidate existing usage.

If a change touches both `SKILL.md` and supporting files, choose the version bump based on the user-visible behavior change in `SKILL.md`. Do not bump the skill version for changes that do not modify `SKILL.md`.

## Commit & Pull Request Guidelines

Recent history mixes short descriptive commits with Conventional Commit prefixes such as `fix:`. Prefer concise, imperative subjects under 72 characters, for example `fix: tighten grinder guidance` or `docs: add origin reference`.

Pull requests should include a clear summary, the reason for the change, and note any affected files or workflows. Include rendered Markdown screenshots only when formatting changes are substantial.
