# Claude Skills

A collection of custom [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash commands for automating complex tasks.

## What are Claude Code skills?

Claude Code supports custom slash commands — markdown files that act as prompt templates. When you type `/command-name` in a Claude Code session, it loads the corresponding markdown file and uses it as instructions. This lets you automate multi-step workflows with a single command.

## Available skills

| Command | Description |
|---------|-------------|
| `/new-trip` | Generate a complete travel planner website (Astro + GitHub Pages) with itineraries, maps, budget tracker, expense logging, charts, PWA support, and more |

## Installation

### Quick install

```bash
git clone https://github.com/Mariatta/claude-skills.git
cd claude-skills
./install.sh
```

The install script creates symlinks from this repo's `commands/` directory into `~/.claude/commands/`. Since they're symlinks, pulling updates from the repo automatically updates your commands — no reinstall needed.

### Manual install

If you prefer, copy individual command files into `~/.claude/commands/`:

```bash
mkdir -p ~/.claude/commands
cp commands/new-trip.md ~/.claude/commands/
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

## Adding your own skills

1. Create a markdown file in the `commands/` directory
2. Use `$ARGUMENTS` as a placeholder for user input
3. Run `./install.sh` to symlink it

Example structure for a new skill:

```markdown
# My Custom Skill

Do something based on: $ARGUMENTS

## Instructions

Describe what Claude should do step by step...
```

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
rm ~/.claude/commands/new-trip.md  # Remove specific command
```

## License

MIT
