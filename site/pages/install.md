---
title: "Installing"
eyebrow: "Start here"
lead: "Ten lines of shell, once. After that the skills load themselves and a git pull keeps them current."
weight: 5
---

## What you need

[Claude Code](https://docs.anthropic.com/en/docs/claude-code), and git. Nothing else:
the skills are Markdown files, with no runtime and no dependencies.

## Install

```bash
git clone https://github.com/Mariatta/claude-skills.git
cd claude-skills
./install.sh
```

That is the whole thing. `install.sh` creates **symlinks**, so the files stay in the
clone and the copies in `~/.claude/` point back at them:

| What | Where it goes |
|---|---|
| each directory in `skills/` | `~/.claude/skills/<name>` |
| each `commands/*.md` | `~/.claude/commands/<name>.md` |

The script never overwrites a real file. If something already exists at the target
and is not a symlink, it says so and skips it, and you decide what to do.

## Check that it worked

```bash
ls -l ~/.claude/skills/
```

You should see `django` and `git` pointing into your clone. There is nothing to
type in Claude Code and no command to run: a skill loads on its own when what you are
doing matches its description. Open a Django project, ask for a change, and the
conventions apply.

If you want to confirm it is loaded, ask Claude which skills it has available.

## Keep them current

```bash
cd claude-skills
git pull
./install.sh
```

Two different things happen there, and it is worth knowing which is which.

**A skill you already have was updated.** `git pull` alone is enough. Your
`~/.claude/skills/django` is a symlink into this clone, so the new text is live the
moment the pull finishes. Nothing to reinstall, and no second copy that can fall
behind.

**A skill was added since you installed.** `git pull` brings the files but nothing in
`~/.claude/skills/` points at the new one yet, so it stays invisible to Claude until
you run `./install.sh` again. The script is safe to re-run as often as you like: it
replaces symlinks it made, and skips anything that is a real file or directory.

Running both, every time, is the version worth remembering. `./install.sh` on an
already-current clone does nothing except print what it checked.

## Point the django skill at your project

The `django` skill separates **portable principles** from **your project's values**.
The principles live in `SKILL.md` and need no editing. Everything specific, which
formatters you run, what your coverage gate is, where your email templates live, sits
in one file:

```bash
$EDITOR skills/django/profile.json
```

[Adapting this skill to your Django project](/django-adapting/) walks through what to
change, section by section. The most common edit by far is swapping black, isort and
flake8 for ruff.

## Use one without installing

If you only want an agent to follow a skill once, point it at the raw file rather
than installing:

```
https://claude-skills.mariatta.ca/raw/django/SKILL.md
```

Every skill file is served verbatim at `/raw/<skill>/<file>`, frontmatter included.
[`/llms.txt`](/llms.txt) lists them all, and is the single URL to hand an agent that
should discover the rest for itself.

The trade-off: nothing loads automatically. You are asking your agent to read a
document this time, rather than giving it a rule it applies unprompted from now on.

## Install by hand instead

If you would rather not run the script, or want the files copied rather than linked:

```bash
mkdir -p ~/.claude/skills
cp -r skills/django ~/.claude/skills/
```

The trade-off is that copies do not follow the repo, so `git pull` no longer updates
them.

## Use one in a single project only

A skill in `~/.claude/skills/` applies everywhere you run Claude Code. To scope one to
a single repository, put it in that repository instead:

```bash
mkdir -p /path/to/your-project/.claude/skills
cp -r skills/django /path/to/your-project/.claude/skills/
```

Claude Code picks up a project's own `.claude/skills/` when you work there. That is
also where a skill belongs if you change it to describe that codebase specifically, at
which point it is no longer generic and should not live in this repo.

## Uninstall

```bash
ls -l ~/.claude/skills/          # confirm which are symlinks
rm ~/.claude/skills/django       # remove one
rm ~/.claude/commands/<name>.md  # same for a command
```

Removing the symlink is enough; nothing is left behind.
