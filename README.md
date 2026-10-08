# Proactive Académie (UI)

The front end of Proactive Académie, the learning platform of Proactive Services: home page, about page,
course catalogue and course pages, instructor page, books page, and the account screens.

This repository is **UI only**. There is no database, authentication or server logic:

- The catalogue (8 demo courses across 10 domains) is served from static content in `lib/data/`.
- Login, signup, account, learning, teaching and admin pages render and validate their forms, then show a
  "version de démonstration" message instead of saving anything.
- Prices can be shown in other currencies; exchange rates are fetched in the browser from a public API,
  with the fixed CFA franc parities as a fallback.

Built with Next.js 16, React 19 and TypeScript.

**Applying this design to another site?** Start with [HANDOFF.md](HANDOFF.md).

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. No environment variables are required; `.env.example` lists the optional ones.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Type-check the project |
| `npm run lint` | Lint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser smoke tests (Playwright; needs `npm run build` first) |

## Where things live

- `app/` – pages and layout (App Router). `app/globals.css` holds the design tokens and shared styles.
- `components/` – catalogue and auth components.
- `lib/data/` – the static demo catalogue and its types.
- `lib/catalog/`, `lib/money/`, `lib/auth/schemas.ts` – catalogue URL handling, price formatting and form validation.
- `public/` – images and videos.
