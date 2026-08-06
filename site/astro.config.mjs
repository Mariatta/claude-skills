import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import popular from 'astro-theme-popular';

// Published as a GitHub project page, so the site lives under a subpath. The
// theme has been base-aware since 0.9.0: it prefixes its own links, adopter
// config hrefs, and links inside Markdown bodies. Drop `base` for a domain root.
export default defineConfig({
  site: 'https://mariatta.github.io',
  base: '/claude-skills',
  integrations: [
    mdx(),
    popular({
      // This site is a handbook, not a community: the theme renders only the
      // sections a site has content for, and these have none.
      routes: {
        blog: false,
        events: false,
        organizers: false,
        speakers: false,
        venues: false,
        authors: false,
        tags: false,
        talks: false,
        rss: false,
        calendar: false,
        // Replaced by src/pages/llms.txt.ts: the theme's version describes a
        // community site and links routes this one does not serve.
        llms: false,
      },
    }),
  ],
});
