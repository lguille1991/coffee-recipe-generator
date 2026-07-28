#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="coffee-recipe-generator"

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

echo "Updating repository..."
git -C "$REPO_ROOT" pull --ff-only

check_install() {
  local root="$1"
  local label="$2"
  local link_path="$root/$SKILL_NAME"

  if [ -L "$link_path" ]; then
    local current_target
    current_target="$(readlink "$link_path")"
    if [ "$current_target" = "$SKILL_SOURCE" ]; then
      echo "$label: linked to this repo -> $link_path"
    else
      echo "$label: symlink points elsewhere -> $current_target"
    fi
    return 0
  fi

  if [ -e "$link_path" ]; then
    echo "$label: installed as a real file or directory; it will not auto-update -> $link_path"
    echo "  To convert it to a live symlink, run: ./scripts/install-skill.sh --force (backs up the copy first)"
    return 0
  fi

  echo "$label: not installed -> $link_path"
}

echo "Checking skill installs..."
check_install "$HOME/.agents/skills" "OpenCode"
check_install "$HOME/.claude/skills" "Claude"
