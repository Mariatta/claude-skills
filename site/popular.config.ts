/** Theme configuration for the Claude Skills docs site.
 *  Copied from the theme's starter config, which is the adopter contract:
 *  every named export has to exist, so the unused blocks (STRINGS, SECTIONS,
 *  PAGINATION) are left as the theme ships them. */

export const SITE = {
  title: "Mariatta's Claude Skills",
  tagline: 'Conventions worth writing down',
  description:
    'Reusable Claude Code skills: house conventions an AI assistant loads on its own, written so a human can read them too.',
  brandName: "Mariatta's",
  brandSub: 'Claude Skills',
  logo: '',
  favicon: '',
  ogImage: '',
  locale: 'en-CA',
  fontAwesome: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  landAcknowledgement: '',
  speakers: { invite: false },
  talks: false,
};

/* UI strings. Only the keys this site's pages actually read: the theme's full
   set covers blog, events, speakers and venues, which this site does not serve.
   Translate the site by editing these values (Hugo parity: i18n/en.toml). */
export const STRINGS: Record<string, string> = {
  skipToContent: 'Skip to content',
  primaryNav: 'Primary',
  toggleMenu: 'Toggle menu',
  eyebrowDocs: 'Skills',
  checklist: 'Checklist',
  checklistDone: 'done',
  copyCode: 'Copy code',
};

/* Imported by the theme's home page, which renames content sections. This site
   serves none of them; the export has to exist, the values do not matter. */
export const SECTIONS_MAP = { authors: 'authors', team: 'organizers' };

/* Re-brand the whole site here; every key maps to a CSS custom property in
   the theme's BaseLayout. Slate and teal: cool and documentation-shaped,
   deliberately not the theme's default marquee gold. */
export const BRAND: Record<string, string> = {
  primary: '#0F766E',
  primaryHover: '#0B5F58',
  primaryActive: '#0A524C',
  surfaceWash: '#D9EDEA',
  surfaceWashSoft: '#F1F8F7',
  ink: '#0F172A',
};

export const NAV: {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}[] = [
  { label: 'Installation', href: '/install/' },
];

export const CTA = { label: 'Browse skills', url: '/skills/', icon: 'fa-solid fa-book-open' };

export const SOCIAL = [
  { label: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/Mariatta/claude-skills' },
];

export const FOOTER = {
  tagline: 'Written for an agent, readable by a person. MIT licensed.',
  credit: { label: 'Popular. An Astro theme by Mariatta.', url: 'https://popular.mariatta.ca/' },
  columns: [
    { title: 'Skills', links: [
      { label: 'All skills', href: '/skills/' },
      { label: 'django', href: '/django/' },
      { label: 'git', href: '/git/' },
    ]},
    { title: 'Repository', links: [
      { label: 'Source', href: 'https://github.com/Mariatta/claude-skills' },
      { label: 'Installing', href: '/install/' },
      { label: 'MIT license', href: 'https://github.com/Mariatta/claude-skills/blob/main/LICENSE' },
    ]},
  ],
};

/** Blog-post support box and demo switcher: neither surface exists here, but
 *  both exports have to be present. */
export const SUPPORT = null;

export const HOME = {
  hero: {
    eyebrow: 'Claude Code skills',
    title: 'Conventions worth writing down',
    lead: 'My own house rules, written down so Claude Code applies them without being asked: how I format, test, gate permissions, handle secrets and ship my Django projects, and what should never reach a commit in any of them. Have a look around, take whatever works for you, and adjust the rest to suit how you like to work.',
    ctas: [
      { label: 'Browse the skills', url: '/skills/', variant: 'primary' },
      { label: 'How to install', url: '/install/', variant: 'outline' },
    ],
  },
  featuresHead: {
    eyebrow: 'What is here',
    title: 'The skills so far, and counting',
    lead: 'More will follow as I keep building with agents. Each is a principle plus a pointer to where a project keeps its own values, so none of them describes a single codebase.',
  },
  features: [
    { icon: 'fa-solid fa-layer-group', title: 'django', body: 'Formatters, imports, docstrings, coverage as a merge gate, permission gating, secrets at rest, email as one Markdown template, and a portable boot contract.' },
    { icon: 'fa-solid fa-code-branch', title: 'git', body: 'Creating a repository with the settings it should have had on day one, where a branch starts and why it decides whether the pull request merges, worktrees, and what must never reach a commit.' },
    { icon: 'fa-solid fa-arrows-rotate', title: 'Derived, not duplicated', body: 'Every page here is generated from the same Markdown Claude loads, so there is no second copy to drift out of date.' },
  ],
  getInvolved: {
    eyebrow: 'The rule behind all of this',
    title: 'Written for an agent, readable by a person',
    lead: 'If something is written for an agent, or works because an agent reads it, a person has to be able to read the same thing and do it themselves. So every rule here is prose with its reasons attached rather than machine instructions, and this site publishes the exact files Claude loads. No agent-only version, no human-only version, and nothing that only makes sense once someone explains it to you.',
    ctas: [
      { label: 'Browse the skills', url: '/skills/', variant: 'primary' },
      { label: 'Install them', url: '/install/', variant: 'outline' },
    ],
  },
};

export const DEMO_BAR = null;
