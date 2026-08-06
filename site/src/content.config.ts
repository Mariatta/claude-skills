/* This site serves one content type: the theme's `docs` collection, which is
   where sync-skills.mjs writes. The theme's other collections (blog, events,
   speakers, venues, organizers, authors) are deliberately not adopted; the
   matching routes are switched off in astro.config.mjs. */
import { collections as themeCollections } from 'astro-theme-popular/schemas';

export const collections = { docs: themeCollections.docs };
