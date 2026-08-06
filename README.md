# Claude Skills

Reusable [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills and commands.

Everything here is **generic**: it applies across projects rather than to one repo. Anything that only makes sense inside a single codebase belongs in that codebase's own `.claude/skills/` or `.claude/commands/`, where Claude Code picks it up automatically when you work there.

The repo holds two kinds of thing, installed to two different places.

## Commands vs skills

**Commands** are markdown files that act as prompt templates. You invoke one by typing `/command-name` in a Claude Code session, and it loads that file as instructions. They live in `commands/` and install to `~/.claude/commands/`.

**Skills** are folders containing a `SKILL.md` with YAML frontmatter, optionally alongside reference files, scripts, and assets. You do not invoke a skill; Claude loads it on its own when the `description` in the frontmatter matches what you are doing. They live in `skills/` and install to `~/.claude/skills/`.

Rule of thumb: a command is something you ask for, a skill is something Claude should already know.

## Available commands

None right now. `/new-trip` used to live here; it only ever made sense inside the travel monorepo it was written for, so it lives there now as a project command.

## Available skills

| Skill | Description |
|-------|-------------|
| `django` | House conventions for Django work: formatter and linter compliance, imports at module top, docstrings, maintained libraries over hand-rolled code, coverage as a merge gate, `has_perm` gating, secrets encrypted at rest, template and CSS rules, the single-Markdown-template email pattern, and a portable container boot contract |
| `gitignore` | What never belongs in version control: the always-ignore baseline led by environment and secret files, the files people wrongly ignore (lockfiles, migrations, `.env.example`), the fact that `.gitignore` does not untrack anything, and rotating a credential that reached a commit |

## Installation

### Quick install

```bash
git clone https://github.com/Mariatta/claude-skills.git
cd claude-skills
./install.sh
```

The install script symlinks `commands/*.md` into `~/.claude/commands/` and each `skills/*/` directory into `~/.claude/skills/`. Since they're symlinks, pulling updates from the repo automatically updates both — no reinstall needed.

### Manual install

If you prefer, copy them yourself:

```bash
mkdir -p ~/.claude/commands ~/.claude/skills
cp -r skills/django ~/.claude/skills/
```

## Usage

Nothing to type for either one. Claude loads a skill when what you are doing matches its `description`.

### `django`

Loads when you are working in a Django project, and applies the conventions in `skills/django/SKILL.md`.

To point it at a project whose stack differs from the reference build, edit `skills/django/profile.json` and read `skills/django/ADAPTING.md`. Every project-specific value lives in the profile, so the conventions themselves stay portable.

### `gitignore`

Loads when a repository is being set up, a `.gitignore` or `.dockerignore` is being written, files are being staged, or a file holding credentials is created. `skills/gitignore/references/templates.md` has paste-ready blocks per ecosystem.

## Adding your own

First question: does it apply to more than one project? If it names a specific repo's files, apps, or data model, it belongs in that repo's `.claude/` directory instead, where it is versioned with the code it describes and loads automatically when you work there.

If it is genuinely generic, and project-specific values can be isolated (the way `django` puts them all in `profile.json`), it goes here.

### A command

1. Create a markdown file in `commands/`
2. Use `$ARGUMENTS` as a placeholder for user input
3. Run `./install.sh` to symlink it

```markdown
# My Custom Command

Do something based on: $ARGUMENTS

## Instructions

Describe what Claude should do step by step...
```

### A skill

1. Create a directory in `skills/` containing a `SKILL.md`
2. Give it YAML frontmatter with `name` and `description`. The description is the only thing Claude sees when deciding whether to load the skill, so it should say both what the skill does and when to use it
3. Run `./install.sh` to symlink it

```markdown
---
name: my-skill
description: What this does, and the situations it applies to. Use whenever <specific contexts>, even if the request does not mention them explicitly.
---

# My Skill

...
```

Keep `SKILL.md` short and put long detail in `references/`, linked from `SKILL.md` with a note about when to read it.

## Updating

```bash
cd claude-skills
git pull
```

That's it — the symlinks mean your commands are always up to date.

## Uninstalling

Remove the symlinks:

```bash
ls -la ~/.claude/commands/  # Check which are symlinks
rm ~/.claude/commands/<name>.md  # Remove a specific command

ls -la ~/.claude/skills/
rm ~/.claude/skills/django  # Remove a specific skill
```

## License

MIT
