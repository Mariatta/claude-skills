# Claude Skills

A collection of custom [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash commands for automating complex tasks.

This repo holds two different things, installed to two different places.

## Commands vs skills

**Commands** are markdown files that act as prompt templates. You invoke one by typing `/command-name` in a Claude Code session, and it loads that file as instructions. They live in `commands/` and install to `~/.claude/commands/`.

**Skills** are folders containing a `SKILL.md` with YAML frontmatter, optionally alongside reference files, scripts, and assets. You do not invoke a skill; Claude loads it on its own when the `description` in the frontmatter matches what you are doing. They live in `skills/` and install to `~/.claude/skills/`.

Rule of thumb: a command is something you ask for, a skill is something Claude should already know.

## Available commands

| Command | Description |
|---------|-------------|
| `/new-trip` | Generate a complete travel planner website (Astro + GitHub Pages) with itineraries, maps, budget tracker, expense logging, charts, PWA support, and more |

## Available skills

| Skill | Description |
|-------|-------------|
| `django` | House conventions for Django work: formatter and linter compliance, imports at module top, docstrings, maintained libraries over hand-rolled code, coverage as a merge gate, `has_perm` gating, secrets encrypted at rest, template and CSS rules, the single-Markdown-template email pattern, and a portable container boot contract |

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
cp commands/new-trip.md ~/.claude/commands/
cp -r skills/django ~/.claude/skills/
```

## Usage

### `/new-trip` — Trip planner generator

Creates a full-featured travel planning website as a static Astro site. The generated site includes:

- Day-by-day itinerary for each city with links and maps
- Hotel and restaurant recommendations with ratings
- Interactive maps (Leaflet + OpenStreetMap)
- Planning checklist with progress tracking
- Budget tracker with multi-currency support and Chart.js charts
- Expense logging with edit/delete and import/export
- Progressive Web App (installable on phone, works offline)
- Responsive design with country-themed colors

#### Examples

**Basic — just a country:**
```
/new-trip Japan
```
Claude will suggest cities, use default dates (14 nights), and ask for your departure airport.

**With cities and dates:**
```
/new-trip Italy — Rome, Florence, Venice. 10 nights, June 15–25, 2027
```

**Solo trip with a conference:**
```
/new-trip South Korea — solo, Seoul and Busan. PyCon Korea Oct 14–15 in Seoul. Oct 10–20, 2027
```

**Couple's trip with a theme:**
```
/new-trip France — couple, Paris, Lyon, Nice. Food tour focus. Sep 2027. Flying from Toronto (YYZ).
```

**Family trip:**
```
/new-trip Spain — family of 4, Barcelona, Madrid, Seville. Jul 5–19, 2027. Home currency: CAD.
```

#### What you can specify

| Parameter | Default | Example |
|-----------|---------|---------|
| Country | *(required)* | Japan, Italy, Taiwan |
| Cities | Auto-suggested | Tokyo, Kyoto, Osaka |
| Dates | 14 nights | Jun 15–25, 2027 |
| Travelers | Solo | family of 4, couple, group of 6 |
| Departure airport | *(asked)* | YVR, YYZ, SFO, LAX |
| Events | None | PyCon Korea Oct 14–15 |
| Trip theme | General | food tour, adventure, relaxation |
| Home currency | USD | CAD, GBP, AUD |

#### Customization

After the site is generated, you can customize it further through conversation:

- Add/remove cities or days
- Adjust budget estimates
- Add specific restaurants or activities
- Change the color theme
- Add new features

## Adding your own

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
rm ~/.claude/commands/new-trip.md  # Remove a specific command

ls -la ~/.claude/skills/
rm ~/.claude/skills/django  # Remove a specific skill
```

## License

MIT
