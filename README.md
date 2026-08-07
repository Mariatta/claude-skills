# Mariatta's Claude Skills

Reusable [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills and commands.

## Written for an agent, readable by a person

This is the rule the whole repo follows. If something is written for an agent, or works because an agent reads it, a person has to be able to read the same thing and do it themselves. Every rule here is prose with its reasons attached rather than machine instructions, and the [docs site](#docs-site) publishes the exact files Claude loads, not a summary of them. There is no agent-only version and no human-only version.

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
| `git` | Working practices for git and the forge around it: creating a repository with the settings it should have had on day one (private or public first, squash-only merges, delete the branch on merge, a ruleset requiring the CI check), cutting a branch from a freshly fetched default branch and the squash-merge trap that follows when you do not, rebasing rather than merging main back in, verifying mergeability before review, paired branches across sibling repositories, what must never be committed and what to do when it already has been, and using `git worktree` when two states are needed at once |

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

### `git`

Loads when a repository is being created, a branch is being created, a pull request is being opened, a conflict turns up in a file nobody edited, a pull request's checks never start, a `.gitignore` is being written, files are being staged, or two branches are needed at once. The recurring one: cut every branch from a freshly fetched default branch, because a squash merge replaces your commit rather than moving it, so a branch cut from an already-merged branch collides with its own work.

Creating a repository asks private or public first, since on GitHub Free a private repository cannot have rulesets or branch protection at all, and then applies squash-only merges, delete-branch-on-merge, and a ruleset requiring the CI check. `skills/git/references/new-repo.md` has the full sequence and the ruleset body; `gitignore.md` has the ignore lists; `gitignore-templates.md` has paste-ready blocks per ecosystem.

### `django`

Loads when you are working in a Django project, and applies the conventions in `skills/django/SKILL.md`.

To point it at a project whose stack differs from the reference build, edit `skills/django/profile.json` and read `skills/django/ADAPTING.md`. Every project-specific value lives in the profile, so the conventions themselves stay portable.

## Adding your own

First question: does it apply to more than one project? If it names a specific repo's files, apps, or data model, it belongs in that repo's `.claude/` directory instead, where it is versioned with the code it describes and loads automatically when you work there.

If it is genuinely generic, and project-specific values can be isolated (the way `django` puts them all in `profile.json`), it goes here.

Then write it so a person can follow it by hand: state the rule, then the reason, in prose someone could act on with no agent involved. A convention that works only because a machine is reading it is not finished.

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

**One skill per domain, not per topic.** Before adding a directory, check whether an existing skill already owns the domain. `django` holds every Django convention in one `SKILL.md`; `git` holds branching, ignoring and worktrees in another. A topic becomes a section under that skill's `## Conventions` or `## Practices`, self-contained, principle first. Splitting the same domain into `git-branching`, `git-commits` and `git-history` would make Claude choose between them at load time, and the choice is usually wrong: someone opening a pull request needs the branching rules and the ignore rules in the same breath.

Add a new skill when the domain is genuinely different (a framework, a language, a tool with its own vocabulary), not when you have more to say about a domain that already has a home.

**Keep `SKILL.md` readable.** When a section grows past what someone would read in one sitting, move the detail into `references/<topic>.md` and leave the principle plus a pointer behind: *"the full lists are in `references/gitignore.md`. Read it before writing an ignore file."* The always-loaded file stays the rules; the reference holds the tables, the templates and the war stories.

**What a skill directory may contain.** Only `SKILL.md` is required; a skill that fits in one file is a complete skill.

| Path | Required | What it is |
|---|---|---|
| `SKILL.md` | yes | The skill Claude loads. YAML frontmatter (`name`, `description`) then the prose |
| `README.md` | no | The human entry point. Its first paragraph becomes the lead on the docs site; the rest is a summary, so it is not published as its own page |
| `references/*.md` | no | Long detail kept out of the always-loaded file. Add the directory only when you have something to put in it |
| Other `*.md` / `*.json` siblings | no | Anything the skill references directly, the way `django` keeps its stack values in `profile.json` |

The docs site derives itself from whatever is there (`site/scripts/sync-skills.mjs`), so adding a file is enough to publish it: `SKILL.md` becomes `/<skill>/`, and every sibling or reference becomes `/<skill>-<file>/`. Nothing in `site/` needs editing by hand.

**Renaming or removing a skill** leaves a dangling symlink in `~/.claude/skills/`, and its published page changes address. Re-run `./install.sh`, which removes links whose target no longer exists, and add a redirect if the old URL was shared anywhere.

## Updating

```bash
cd claude-skills
git pull
./install.sh
```

`git pull` is enough for skills you already have: they are symlinked into `~/.claude/`, so an update to a file is live immediately, with no second copy to refresh.

Re-running `./install.sh` is what picks up skills **added** since you installed. Without it, the new files sit in the clone with nothing in `~/.claude/skills/` pointing at them, so Claude never sees them. The script is idempotent, so running both every time is the habit worth having.

## Uninstalling

Remove the symlinks:

```bash
ls -la ~/.claude/commands/  # Check which are symlinks
rm ~/.claude/commands/<name>.md  # Remove a specific command

ls -la ~/.claude/skills/
rm ~/.claude/skills/django  # Remove a specific skill
```

## Docs site

The skills are also published as a site, generated from the same Markdown Claude
loads, so there is no second copy to keep in sync. See [`site/`](site/README.md)
to run it locally.

## License

MIT. See [LICENSE](LICENSE).
