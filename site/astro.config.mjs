import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import popular from 'astro-theme-popular';

// Served from the root of its own domain (public/CNAME), so no `base`. For a
// GitHub project page instead, set base: '/claude-skills' and point `site` at
// https://mariatta.github.io; the theme has been base-aware since 0.9.0.
export default defineConfig({
  site: 'https://claude-skills.mariatta.ca',
  // The gitignore skill was folded into git, so the addresses it published under
  // stopped resolving. A static build turns these into meta-refresh pages, which
  // is all a static host can do and enough for a URL someone bookmarked.
  // `/gitignore/` was the whole skill: its rule is now a practice inside `/git/`,
  // which links on to the lists, so the skill page is the honest destination.
  redirects: {
    '/gitignore': '/git/',
    '/gitignore-templates': '/git-gitignore-templates/',
  },
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
