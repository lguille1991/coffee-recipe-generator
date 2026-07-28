#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="coffee-recipe-generator"
TARGET="all"
CUSTOM_ROOT=""
FORCE=0

usage() {
  cat <<'USAGE'
Usage: scripts/install-skill.sh [options]

Install the coffee-recipe-generator skill by symlinking this repository's
coffee-recipe-generator/ directory into one or more agent skill locations.

Options:
  --target opencode   Install to ~/.agents/skills only
  --target claude     Install to ~/.claude/skills only
  --target all        Install to both standard locations (default)
  --path DIR          Install to a custom skills root directory
  --force             Replace an existing symlink that points elsewhere, or
                      back up an existing real directory/file and replace it
                      with a symlink to this repository
  -h, --help          Show this help

Without --force, the installer refuses to overwrite a real directory or file.
With --force, real directories or files are moved to a timestamped backup
next to the install path, never deleted.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --target" >&2
        exit 1
      fi
      TARGET="$2"
      shift 2
      ;;
    --path)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --path" >&2
        exit 1
      fi
      CUSTOM_ROOT="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

case "$TARGET" in
  opencode|claude|all) ;;
  *)
    echo "Invalid --target value: $TARGET" >&2
    echo "Expected one of: opencode, claude, all" >&2
    exit 1
    ;;
esac

if [ -n "$CUSTOM_ROOT" ] && [ "$TARGET" != "all" ]; then
  echo "Use either --path or --target, not both." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
  echo "Could not find a git repository root. Run this script from the cloned repo." >&2
  exit 1
fi

SKILL_SOURCE="$REPO_ROOT/$SKILL_NAME"
if [ ! -f "$SKILL_SOURCE/SKILL.md" ]; then
  echo "Expected skill file not found: $SKILL_SOURCE/SKILL.md" >&2
  exit 1
fi

install_into_root() {
  local root="$1"
  local label="$2"
  local link_path="$root/$SKILL_NAME"

  mkdir -p "$root"

  if [ -L "$link_path" ]; then
    local current_target
    current_target="$(readlink "$link_path")"
    if [ "$current_target" = "$SKILL_SOURCE" ]; then
      echo "$label: already linked -> $SKILL_SOURCE"
      return 0
    fi

    if [ "$FORCE" -ne 1 ]; then
      echo "$label: existing symlink points to $current_target" >&2
      echo "Run with --force to replace that symlink." >&2
      exit 1
    fi

    rm "$link_path"
    ln -s "$SKILL_SOURCE" "$link_path"
    echo "$label: relinked -> $SKILL_SOURCE"
    return 0
  fi

  if [ -e "$link_path" ]; then
    if [ "$FORCE" -ne 1 ]; then
      echo "$label: $link_path already exists and is not a symlink." >&2
      echo "Run with --force to back it up and replace it with a symlink to this repository." >&2
      exit 1
    fi

    local backup_path="${link_path}.bak.$(date +%Y%m%d-%H%M%S)"
    mv "$link_path" "$backup_path"
    echo "$label: backed up existing install -> $backup_path"
    ln -s "$SKILL_SOURCE" "$link_path"
    echo "$label: linked -> $SKILL_SOURCE"
    return 0
  fi

  ln -s "$SKILL_SOURCE" "$link_path"
  echo "$label: linked -> $SKILL_SOURCE"
}

if [ -n "$CUSTOM_ROOT" ]; then
  install_into_root "$CUSTOM_ROOT" "Custom"
else
  case "$TARGET" in
    opencode)
      install_into_root "$HOME/.agents/skills" "OpenCode"
      ;;
    claude)
      install_into_root "$HOME/.claude/skills" "Claude"
      ;;
    all)
      install_into_root "$HOME/.agents/skills" "OpenCode"
      install_into_root "$HOME/.claude/skills" "Claude"
      ;;
  esac
fi

echo "Installed $SKILL_NAME. Run scripts/update-skill.sh from this repo to pull updates."
