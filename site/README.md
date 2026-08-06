# The docs site

The skills are Markdown, which is what Claude loads. This turns the same files
into a site for people to read.

```bash
cd site
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

## How it works

`../skills/` is the single source of truth. Nothing here edits it, and nothing
here is a second copy of it: `scripts/sync-skills.mjs` reads the skills and
generates `src/content/docs/`, which is gitignored, before every dev run and
build. Editing a skill and refreshing is the whole loop.

| Source | Page |
|---|---|
| `skills/<name>/SKILL.md` | `/<name>/` |
| `skills/<name>/ADAPTING.md` | `/<name>-adapting/` |
| `skills/<name>/references/<file>.md` | `/<name>-<file>/` |
| `skills/<name>/profile.json` | `/<name>-profile/` (fenced JSON) |

The sync step does three things worth knowing about:

- **Frontmatter is translated, not copied.** A skill's frontmatter is `name` and
  `description`, where `description` is written so Claude loads the skill at the
  right moment. As human prose it reads like keyword soup, so the page `lead`
  comes from the skill's `README.md` instead, and the real description appears in
  a "How Claude loads this" section at the bottom of the page, where it is
  interesting rather than in the way.
- **Paths become links.** Skills refer to each other in code spans
  (`` `references/email.md` ``), which is correct on disk. On the site those are
  pages, so the span is turned into a link when a page for it exists, and left
  alone when it does not.
- **`README.md` is not published.** Its opening line is the page lead; the rest
  duplicates `SKILL.md`.

## Theme

[`astro-theme-popular`](https://github.com/Mariatta/astro-theme-popular), from npm.
The site uses the theme's `docs` collection (scroll-spy TOC, checklists) and turns
off the community routes it has no content for, in `astro.config.mjs`.

`popular.config.ts` is a copy of the theme's starter config with the identity
blocks rewritten. The unused blocks (`STRINGS`, `SECTIONS`, `PAGINATION`) stay as
the theme ships them because every named export has to exist.

## Where it is published

A GitHub project page: `mariatta.github.io/claude-skills/`, deployed by
`.github/workflows/docs.yml` on pushes to `main` that touch `skills/` or `site/`.

That is a subpath, which the theme handles as of **0.9.0**: `base` is set in
`astro.config.mjs` and the theme prefixes its own links, the hrefs in
`popular.config.ts`, and links inside Markdown bodies. Nothing here needs to know
the base, so `sync-skills.mjs` writes plain site-absolute links like
`/django-email/`.

To serve from a domain root instead, delete `base` from `astro.config.mjs` and point
`site` at the domain. Nothing else changes.
