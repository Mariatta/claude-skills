#!/bin/bash
# Install claude-skills by symlinking commands into ~/.claude/commands/
#
# Usage:
#   git clone https://github.com/Mariatta/claude-skills.git
#   cd claude-skills
#   ./install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMANDS_SRC="$SCRIPT_DIR/commands"
COMMANDS_DST="$HOME/.claude/commands"

# Create the destination directory if it doesn't exist
mkdir -p "$COMMANDS_DST"

echo "Installing claude-skills..."
echo "  Source: $COMMANDS_SRC"
echo "  Target: $COMMANDS_DST"
echo ""

count=0
for file in "$COMMANDS_SRC"/*.md; do
  [ -f "$file" ] || continue
  name="$(basename "$file")"
  target="$COMMANDS_DST/$name"

  if [ -L "$target" ]; then
    echo "  Updating: $name (replacing existing symlink)"
    rm "$target"
  elif [ -f "$target" ]; then
    echo "  Skipping: $name (file already exists and is not a symlink)"
    echo "           Remove it manually if you want to use the version from this repo:"
    echo "           rm $target"
    continue
  else
    echo "  Installing: $name"
  fi

  ln -s "$file" "$target"
  count=$((count + 1))
done

echo ""
if [ $count -eq 0 ]; then
  echo "No new commands installed."
else
  echo "Installed $count command(s)."
  echo ""
  echo "Available commands in Claude Code:"
  for file in "$COMMANDS_SRC"/*.md; do
    [ -f "$file" ] || continue
    name="$(basename "$file" .md)"
    echo "  /$name"
  done
fi

echo ""
echo "Since these are symlinks, pulling updates from the repo"
echo "will automatically update your commands — no reinstall needed."
