# specialty-coffee-recipes-skills

A portable skill package for specialty coffee workflows. The main skill, `coffee-recipe-generator`, helps an agent analyze coffee bag details, generate brewing recipes, adapt recipes across beans or brewers, and research brewing techniques from primary sources.

## How the Skill Works

The skill lives in `coffee-recipe-generator/SKILL.md`. It defines four workflows:

- **Bag Analysis:** extracts details from a coffee bag image and formats them with `templates/coffee-profile.md`.
- **Quick Coffee Guidance:** answers brewer recommendations, comparisons, and general coffee questions without forcing a full recipe.
- **Recipe Generation:** builds a brew recipe from method, dose, origin, and processing method.
- **Recipe Adaptation:** adjusts an existing recipe for a different bean, brewer, filter, or flavor goal.
- **Primary-Source Research:** summarizes brewing science, equipment guidance, or competition techniques with exact source URLs.

The skill is storage-optional. It can read and write profiles or recipes if a host system provides storage, but it must also work from inline chat inputs and return Markdown directly.

## Repository Layout

- `coffee-recipe-generator/SKILL.md`: primary workflow rules and required behavior
- `coffee-recipe-generator/templates/`: Markdown scaffolds for profiles and recipes
- `coffee-recipe-generator/references/`: brewing defaults, grinder ranges, origin guidance, troubleshooting, equipment notes, and research sources
- `coffee-recipe-generator/scripts/`: reusable validation scripts for skill outputs
- `bin/coffee-recipe-generator.js`: npm installation and status CLI
- `package.json`: npm package metadata, contents, and release checks
- `scripts/install-skill.sh`: symlink installer for OpenCode and Claude skill locations
- `scripts/update-skill.sh`: update helper that pulls the latest repo and reports install status
- `.codex/hooks.json`: Codex hook wiring for repository-local validation
- `AGENTS.md`: contributor guidance for maintaining this repository

## Installation

Install the published package with npm:

```bash
npx coffee-recipe-generator install
```

By default, the npm installer copies the skill into both supported locations:

- OpenCode: `~/.agents/skills/coffee-recipe-generator`
- Claude: `~/.claude/skills/coffee-recipe-generator`

Select one target or a custom skills root with:

```bash
npx coffee-recipe-generator install --target opencode
npx coffee-recipe-generator install --target claude
npx coffee-recipe-generator install --path /path/to/skills
```

The installer will not replace an existing file, directory, or symlink unless
you explicitly pass `--force`. Check the standard locations with:

```bash
npx coffee-recipe-generator status
```

### Installing from a Clone

For development, clone the repository and run the shell installer:

```bash
git clone https://github.com/lguille1991/coffee-recipe-generator.git
cd coffee-recipe-generator
./scripts/install-skill.sh
```

By default, the shell installer links the skill into both supported locations:

- OpenCode: `~/.agents/skills/coffee-recipe-generator`
- Claude: `~/.claude/skills/coffee-recipe-generator`

The installer creates symlinks instead of copying files. This keeps the active skill tied to this cloned repository, so pulling new commits updates the installed skill without another manual copy.

To install only one target, run:

```bash
./scripts/install-skill.sh --target opencode
./scripts/install-skill.sh --target claude
```

To install into a custom skills root, run:

```bash
./scripts/install-skill.sh --path /path/to/skills
```

If a real directory or file already exists at the install path, the installer stops instead of overwriting it. If an existing symlink points somewhere else, pass `--force` to replace that symlink.

## Updating

For an npm installation, install the current package and replace the copied
skill:

```bash
npx coffee-recipe-generator@latest install --force
```

For a clone-based installation, run the update helper from the repository root:

```bash
./scripts/update-skill.sh
```

The updater runs `git pull --ff-only`, then reports whether the OpenCode and Claude skill locations are correctly symlinked to this repository. Because installation uses symlinks, the active skill uses the latest pulled files immediately.

## Publishing to npm

The npm package version in `package.json` must match `metadata.version` in
`coffee-recipe-generator/SKILL.md`. A release publishes the CLI, the complete
skill directory, this README, and the license.

Before publishing, run:

```bash
npm test
npm pack --dry-run
```

After reviewing the tarball contents, authenticate and publish the new version:

```bash
npm login
npm publish
```

npm versions are immutable. Increment both versions before publishing another
release.

## How to Use It

Load `coffee-recipe-generator` when the user asks for coffee bag analysis, recipe generation, recipe tuning, recipe adaptation, or brewing research.

For questions such as “Which brewer suits these beans?” or “Is V60 or Kalita better for this coffee?”, answer concisely from the pairing and equipment references. Generate the full recipe only when the user explicitly asks for a recipe, dial-in, or complete brewing instructions.

For recipe generation, collect these required inputs:

- Brew method, such as V60, AeroPress, Orea, Chemex, or French Press
- Coffee dose in grams
- Coffee origin
- Processing method, such as washed, natural, or honey
- Flavor intent: clarity, balanced, sweetness, body, or forgiveness
- For V60 only, recipe style: classic or Tetsu Kasuya's 4:6 method

Optional inputs improve accuracy: roast level, variety, elevation, strength preference, available brewer, and grinder model.

Every generated or adapted recipe must include a grinder table with these five rows: `1Zpresso K-Ultra`, `1Zpresso Q Air`, `Baratza Encore ESP`, `Fellow Opus`, and `Timemore C2`. Use `references/grinder-settings.md` and `references/grind-determinants.md` instead of estimating from generic grind labels.

## Output Expectations

Recipes should follow `templates/recipe-output.md` and include:

- Coffee Details
- Overview
- Flavor Profile
- Brew Timeline
- Brewing Steps
- Troubleshooting Guide
- Adjusting for Your Taste

Every bloom and pour must state a numeric pour speed in grams per second (`g/s`) in both the Brew Timeline and its corresponding Brewing Step.

Coffee profiles should follow `templates/coffee-profile.md`. If no storage destination is configured, return the finished profile or recipe inline as Markdown.

When this repository's Codex hooks are trusted, the `Stop` hook runs `coffee-recipe-generator/scripts/validate-recipe-output.py` to request a correction pass if a generated recipe omits required sections, any of the five grinder rows, or numeric `g/s` speeds for its pours. Skill, template, hook, and validator maintenance requests are excluded unless the assistant response itself contains a recipe.

Run the focused hook regression tests with:

```bash
python3 coffee-recipe-generator/scripts/test-validate-recipe-output.py
```

## Troubleshooting

Use `references/troubleshooting.md` when adjusting a recipe after tasting.

- Sour or under-extracted: grind 1-2 clicks finer, raise temperature 1-2 C, or pour more slowly.
- Bitter or over-extracted: grind 1-2 clicks coarser, lower temperature 1-2 C, or pour faster.
- Weak or watery: grind finer, use more coffee, or slow the first pour.
- Too strong: grind coarser, use less coffee, or dilute after brewing.
- Muddy or cloudy: reduce agitation, pour more gently, or allow the bed to settle.

If a coffee bag image is unreadable, ask for a clearer photo rather than guessing missing fields. If origin or processing method is missing for recipe generation, ask for it before generating the recipe.

## Maintenance Notes

Keep references and templates plain Markdown so they can work in chat, local files, Obsidian, Notion, and GitHub. When adding a new brewing rule, update the relevant file in `references/` and ensure `SKILL.md` points to it if the workflow depends on it.
