# Create a new trip planner website

Create a complete trip planner website based on: $ARGUMENTS

## Parse the arguments

Extract the following from `$ARGUMENTS`. Use the defaults shown if not specified:

- **Country** (required): The destination country
- **Cities** (optional): Specific cities to visit. If not provided, suggest 3–5 popular cities for the country and duration.
- **Dates** (optional): Trip dates. Default: 14 nights
- **Travelers** (optional): Who is traveling — e.g. "family of 4", "couple", "solo", "group of 6". Default: solo
- **Departing from** (optional): Home airport. Default: ask the user
- **Vehicle type** (optional): "EV" or "gas". Default: EV. When driving, calculate fuel/charging costs using EV rates unless the user specifies a gas car.
- **Events** (optional): Conferences, weddings, festivals, etc. If specified, integrate into the itinerary on the correct dates and add to the checklist.
- **Purpose/theme** (optional): e.g. "food tour", "adventure", "relaxation", "conference + sightseeing". Influences itinerary and tips.
- **Home currency** (optional): The traveler's home currency for budget planning. Default: USD

## What to build

An Astro static site deployed on GitHub Pages. The site should include:

- Day-by-day itinerary for each city
- Hotel recommendations (3–4 per city) with ratings, price tiers, and tips
- Restaurant recommendations (3–5 per city) with must-try dishes
- Interactive maps (Leaflet + OpenStreetMap) with pins for attractions, hotels, and restaurants
- Planning checklist with localStorage persistence
- Budget tracker with multi-currency support (home currency + local currency), exchange rate toggle, Chart.js visualizations
- Expense logging with edit/delete, per-category tracking, and import/export for cross-device sync
- Separate quick-entry `/log/` page optimized for mobile
- PWA support (manifest, service worker, offline caching, update notifications)
- Open Graph and Twitter Card meta tags
- Responsive design with custom fonts (Cormorant Garamond + Jost)

## Project setup

- Create the project directory as `{country}-trip` (lowercase, hyphenated) in the current working directory, or in the path the user specifies
- Initialize an Astro project with `astro` as the only dependency
- Configure `astro.config.mjs` with `site`, `base: '/{country}-trip'`, `output: 'static'`, `trailingSlash: 'always'`
- Add `.gitignore` (node_modules, dist, .astro, .idea)
- Add a GitHub Actions deploy workflow for GitHub Pages

## Adapting for traveler count

- **Hotel descriptions:** Adjust room type notes (e.g. "double room" for couples, "family room or 2 doubles" for families, "single" for solo)
- **Budget estimates:** Scale food, activities, and transport estimates based on number of travelers
- **Flight budget:** Scale ~$2,000 USD equivalent per person for long-haul, ~$500–800 for short-haul
- **Driving costs:** Default to EV charging rates. Only use gas estimates if the user specifies "gas car".
- **Activity costs:** Note per-person pricing with correct total for the group size

## Adapting for events

If a conference, festival, or event is specified:
- Add dedicated itinerary days for the event
- Add a budget category for the event (tickets, registration, social events)
- Add checklist items (registration, schedule review, packing event materials)
- Mention the event in the overview page and about page
- Adjust the city schedule to accommodate the event dates

## Site structure

```
src/
├── layouts/
│   └── Layout.astro           # Main layout with global styles, meta tags, PWA, update banner
├── components/
│   ├── Nav.astro              # Sticky navigation with all page links
│   ├── CityPage.astro         # Reusable city page template with prev/next navigation
│   ├── HotelCard.astro        # Hotel recommendation card
│   ├── RestaurantCard.astro   # Restaurant recommendation card
│   ├── DayCard.astro          # Day itinerary card
│   └── MapSection.astro       # Leaflet interactive map with legend
├── data/
│   ├── types.ts               # TypeScript interfaces
│   ├── {city1}.ts             # City data (hotels, restaurants, itinerary, map points)
│   ├── {city2}.ts             # ...one file per city
│   ├── budget.ts              # Budget categories with estimates
│   └── checklist.ts           # Planning checklist items
└── pages/
    ├── index.astro            # Home page with overview, route, travel tips
    ├── {city1}.astro           # City pages (one per city)
    ├── checklist.astro        # Interactive planning checklist
    ├── budget.astro           # Budget dashboard with charts
    ├── log.astro              # Quick expense entry page
    ├── sync.astro             # Import/export expense data
    └── about.astro            # About page
public/
├── favicon.svg                # Country-themed favicon
├── icon-192.svg               # PWA icon
├── icon-512.svg               # PWA icon
├── manifest.json              # PWA manifest
└── sw.js                      # Service worker
```

## Data files

### types.ts
Define interfaces for: Hotel, Restaurant, Activity, Day, ChecklistItem, ChecklistCategory, MapPoint, BudgetItem (with `currency` field), BudgetCategory, CityData.

### City data files
Each city needs:
- Real lat/lng coordinates for all map points
- 3–4 hotels with ratings, price tiers in local currency, tags, descriptions, tips
- 3–5 restaurants with ratings, must-try dishes, hours, booking advice
- Day-by-day itinerary with activity descriptions, URLs to official sites, and Google Maps links

### budget.ts
- 10 categories: flights, accommodation, inter-city transport, food & dining, local transport, activities, shopping, connectivity, events (if applicable), miscellaneous
- Pre-trip items in home currency, during-trip items in local currency
- Each item has an `id`, `label`, `estimated` amount, `currency`, and optional `note`

### checklist.ts
Country-specific items covering: flights & transport, accommodation, documents & insurance, events (if applicable), activities & bookings, money & connectivity, packing (climate-appropriate), before departure

## Theming

Choose 2–3 colors from the destination country's flag:
- Define as CSS custom properties (e.g. `--xx-red`, `--xx-blue`)
- Use the primary color for: active nav states, section labels, eyebrow text, buttons, progress bars, links
- Use in the tile pattern background, hero gradients, and favicon
- Favicon: diagonal split with 2 flag colors, white "M" monogram (or first letter of traveler's name)

## Budget page specifics

- Currency toggle between home currency and local currency (saved to localStorage)
- Editable exchange rate (saved to localStorage)
- All amounts convert automatically when toggling
- Per-item currency selector on expense forms
- Charts: estimated vs actual (bar), spending by category (doughnut), spending by city (doughnut)
- Floating "+" button linking to `/log/` page
- All localStorage keys use `{country}-` prefix

## Footer

All pages should have:
```
{flag emoji} {Country} Trip for {Travelers} · {Month} {Year}
Built with Astro · Hosted on GitHub Pages (linked to repo)
```

## Important details

- Use real, accurate coordinates for map points
- Use real hotel/restaurant names and ratings
- Include real URLs to official websites where available
- All localStorage keys must be unique per project
- Do NOT use hardcoded EUR/€ — always use the destination's local currency
- Service worker should use network-first for HTML pages (not stale-while-revalidate) to avoid CSS scoping issues
- Do NOT prompt the user during creation — build everything and verify with `npx astro build`
- Do NOT commit node_modules

## Final steps

1. Run `npx astro build` and verify all pages compile successfully
2. Initialize a git repo with `.gitignore`
3. Create initial commit
4. Ask the user if they want to create the GitHub repo and push
