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
SKILLS_SRC="$SCRIPT_DIR/skills"
SKILLS_DST="$HOME/.claude/skills"

# Create the destination directories if they don't exist
mkdir -p "$COMMANDS_DST"
mkdir -p "$SKILLS_DST"

echo "Installing claude-skills..."
echo "  Commands: $COMMANDS_SRC -> $COMMANDS_DST"
echo "  Skills:   $SKILLS_SRC -> $SKILLS_DST"
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

# Skills are directories, not single files, so they are symlinked whole.
skill_count=0
if [ -d "$SKILLS_SRC" ]; then
  for dir in "$SKILLS_SRC"/*/; do
    [ -d "$dir" ] || continue
    [ -f "$dir/SKILL.md" ] || continue
    name="$(basename "$dir")"
    target="$SKILLS_DST/$name"

    if [ -L "$target" ]; then
      echo "  Updating skill: $name (replacing existing symlink)"
      rm "$target"
    elif [ -d "$target" ]; then
      echo "  Skipping skill: $name (directory already exists and is not a symlink)"
      echo "                 Remove it manually if you want to use the version from this repo:"
      echo "                 rm -r $target"
      continue
    else
      echo "  Installing skill: $name"
    fi

    ln -s "${dir%/}" "$target"
    skill_count=$((skill_count + 1))
  done
fi

if [ $skill_count -eq 0 ]; then
  echo "No new skills installed."
else
  echo "Installed $skill_count skill(s)."
  echo ""
  echo "Skills load automatically when relevant — there is no slash command to type."
fi

echo ""
echo "Since these are symlinks, pulling updates from the repo"
echo "will automatically update your commands and skills — no reinstall needed."
