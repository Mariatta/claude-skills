/**
 * Derive the docs site from ../skills.
 *
 * `skills/` is the single source of truth: the files Claude loads are never
 * edited or copied by hand. This script reads them and writes the theme's
 * `docs` collection into src/content/docs/, which is generated output and
 * gitignored. Run it before dev and build (see package.json).
 *
 * The mapping, per skill:
 *
 *   skills/<name>/SKILL.md            -> docs/<name>.md            (the skill)
 *   skills/<name>/<OTHER>.md          -> docs/<name>-<other>.md    (siblings)
 *   skills/<name>/references/<r>.md   -> docs/<name>-<r>.md        (references)
 *   skills/<name>/<file>.json         -> docs/<name>-<file>.md     (fenced)
 *
 * README.md is not published: its opening line becomes the skill page's
 * `lead`, and the rest duplicates SKILL.md.
 *
 * Links are written site-absolute (`/django-email/`). The theme prefixes them
 * with Astro's `base` at render time, so nothing here needs to know where the
 * site is published.
 *
 * Hand-written pages that are not derived from a skill (the install guide) live
 * in site/pages/ with the theme's frontmatter already on them, and are copied
 * through unchanged. They live outside src/content/docs/ because this script
 * empties that directory on every run.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILLS = join(HERE, '..', '..', 'skills');
const OUT = join(HERE, '..', 'src', 'content', 'docs');
const AUTHORED = join(HERE, '..', 'pages');
/* Verbatim copies of the skill files, served at /raw/<skill>/… so a person can
   hand an agent a URL instead of installing. Generated, hence gitignored. */
const RAW = join(HERE, '..', 'public', 'raw');
const MANIFEST = join(HERE, '..', 'src', 'skills.manifest.json');

/** Split YAML frontmatter off a markdown file. Values are flat strings here,
 *  so a real YAML parser would be a dependency for nothing. */
function splitFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const start = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (start) {
      key = start[1];
      data[key] = start[2];
    } else if (key && line.trim()) {
      data[key] += ' ' + line.trim();
    }
  }
  return { data, body: text.slice(match[0].length) };
}

/** A YAML double-quoted scalar. The descriptions contain quotes and colons. */
function yamlString(value) {
  return JSON.stringify(String(value).trim());
}

/** First `# Heading` in a document, for pages whose title is not in frontmatter. */
function firstHeading(body, fallback) {
  const match = /^#\s+(.+)$/m.exec(body);
  return match ? match[1].trim() : fallback;
}

/** First paragraph of a README, used as the skill page's human lead. */
function firstParagraph(text) {
  const withoutTitle = text.replace(/^#\s+.+\r?\n+/, '');
  const paragraph = withoutTitle.split(/\r?\n\r?\n/)[0] ?? '';
  return paragraph.replace(/\s+/g, ' ').trim();
}

/** Turn a title into the slug the theme's catch-all route will serve it at. */
function slugFor(skill, file) {
  const stem = basename(file, extname(file)).toLowerCase();
  return stem === 'skill' ? skill : `${skill}-${stem}`;
}

/**
 * Rewrite in-repo links so they resolve as site routes.
 *
 * A skill links the way its files sit on disk (`references/email.md`,
 * `profile.json`), which is right for the file tree and wrong for the site.
 * Anything that does not correspond to a published page is left alone: a
 * link to a file that is not on the site should stay visibly a file path
 * rather than 404 as a route.
 */
function rewriteLinks(body, skill, published) {
  return body.replace(/\]\((?!https?:|#|\/)([^)\s]+)\)/g, (whole, target) => {
    const slug = slugFor(skill, target);
    return published.has(slug) ? `](/${slug}/)` : whole;
  });
}

/**
 * Turn `references/email.md` into a link to that page, keeping the code style.
 *
 * The skills name sibling files in code spans rather than links, which is
 * correct on disk: they are paths, and Claude reads them as paths. On the site
 * the same span is a page that exists, so it should be reachable. Spans that do
 * not name a published page (`CLAUDE.md`, `manage.py`) are left as code.
 */
function linkifyPaths(body, skill, published) {
  return body.replace(/(\[)?`([^`\n]+\.(?:md|json))`(\])?/g, (whole, open, path, close) => {
    if (open || close) return whole; // already inside a link
    const slug = slugFor(skill, path);
    return published.has(slug) ? `[\`${path}\`](/${slug}/)` : whole;
  });
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  rmSync(RAW, { recursive: true, force: true });
  mkdirSync(RAW, { recursive: true });

  const manifest = [];

  const skills = readdirSync(SKILLS)
    .filter((name) => statSync(join(SKILLS, name)).isDirectory())
    .filter((name) => statSync(join(SKILLS, name, 'SKILL.md'), { throwIfNoEntry: false }))
    .sort();

  let written = 0;

  // Authored pages first: they carry their own frontmatter and set their own
  // weight, which is how the install guide sits above the skills in the sidebar.
  for (const file of readdirSync(AUTHORED).filter((f) => extname(f) === '.md').sort()) {
    writeFileSync(join(OUT, file), readFileSync(join(AUTHORED, file), 'utf8'), 'utf8');
    written += 1;
  }

  skills.forEach((skill, index) => {
    const dir = join(SKILLS, skill);
    const base = (index + 1) * 10;

    const siblings = readdirSync(dir)
      .filter((f) => f !== 'SKILL.md' && f !== 'README.md')
      .filter((f) => ['.md', '.json'].includes(extname(f)))
      .sort();
    const references = readdirSync(join(dir, 'references'), { withFileTypes: true })
      .filter((e) => e.isFile() && extname(e.name) === '.md')
      .map((e) => join('references', e.name))
      .sort();

    const files = [...siblings, ...references];
    const published = new Set([skill, ...files.map((f) => slugFor(skill, f))]);

    /* Verbatim copies, frontmatter and all: this is what an agent should read. */
    mkdirSync(join(RAW, skill, 'references'), { recursive: true });
    for (const file of ['SKILL.md', ...files]) {
      writeFileSync(join(RAW, skill, file), readFileSync(join(dir, file), 'utf8'), 'utf8');
    }

    // The skill itself.
    const skillText = readFileSync(join(dir, 'SKILL.md'), 'utf8');
    const { data, body } = splitFrontmatter(skillText);
    const readmePath = join(dir, 'README.md');
    const lead = statSync(readmePath, { throwIfNoEntry: false })
      ? firstParagraph(readFileSync(readmePath, 'utf8'))
      : '';

    const trigger = [
      '',
      '## How Claude loads this',
      '',
      'Skills are not invoked. Claude reads the `description` in the skill\'s frontmatter',
      'and loads the whole file when what you are doing matches it. This one reads:',
      '',
      '> ' + data.description.replace(/\s+/g, ' ').trim(),
      '',
      `Source: [\`skills/${skill}/SKILL.md\`](https://github.com/Mariatta/claude-skills/blob/main/skills/${skill}/SKILL.md).`,
      '',
    ].join('\n');

    manifest.push({
      name: data.name ?? skill,
      description: data.description.replace(/\s+/g, ' ').trim(),
      slug: skill,
      files: ['SKILL.md', ...files],
      pages: files.map((f) => ({ file: f, slug: slugFor(skill, f) })),
    });

    write(`${skill}.md`, {
      title: data.name ?? skill,
      eyebrow: 'Skill',
      lead,
      weight: base,
      body: linkifyPaths(rewriteLinks(body, skill, published), skill, published) + trigger,
    });
    written += 1;

    // Everything the skill links to.
    files.forEach((file, offset) => {
      const raw = readFileSync(join(dir, file), 'utf8');
      const slug = slugFor(skill, file);
      const isJson = extname(file) === '.json';
      const label = basename(file);

      const content = isJson
        ? [`Every project-specific value the \`${skill}\` skill reads, in one file.`, '', '```json', raw.trim(), '```'].join('\n')
        : linkifyPaths(rewriteLinks(splitFrontmatter(raw).body, skill, published), skill, published);

      write(`${slug}.md`, {
        title: isJson ? label : firstHeading(content, label),
        eyebrow: `${skill} reference`,
        lead: '',
        weight: base + offset + 1,
        body: content,
      });
      written += 1;
    });
  });

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`sync-skills: ${written} page(s) from ${skills.length} skill(s) + authored -> ${relative(process.cwd(), OUT)}`);
}

function write(name, { title, eyebrow, lead, weight, body }) {
  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `eyebrow: ${yamlString(eyebrow)}`,
    ...(lead ? [`lead: ${yamlString(lead)}`] : []),
    `weight: ${weight}`,
    '---',
    '',
    '<!-- Generated by scripts/sync-skills.mjs from ../skills. Do not edit. -->',
    '',
  ].join('\n');
  // The theme renders `title` as the page heading, so a leading `# Heading`
  // in the source would show up twice.
  const withoutTitle = body.replace(/^\s*#\s+.+\r?\n+/, '');
  writeFileSync(join(OUT, name), frontmatter + withoutTitle, 'utf8');
}

build();
