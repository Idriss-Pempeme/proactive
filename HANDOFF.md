# Design handoff: applying the Proactive Académie UI to an existing site

This branch (`ui-only`) is a complete, working front end with no backend: every page renders, but the data is static
demo data and forms do not save anything. Use it as the **reference implementation** of the design. Run it,
compare it side by side with the existing site, and carry the styles, markup and assets across.

## 1. Get it running

```bash
git clone -b ui-only https://github.com/Idriss-Pempeme/proactive.git
cd proactive
npm install
npm run dev        # http://localhost:3000
```

Requires Node.js 20.9+. No environment variables are needed.

Stack: Next.js 16 (App Router), React 19, TypeScript, plain CSS with CSS Modules. There is no Tailwind and no UI
library, so all of the styling can be read directly from the `.css` files.

## 2. Pages to port

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `app/(marketing)/page.tsx`, `app/components/Hero.tsx`, `app/(marketing)/HomeEffects.tsx` | Video hero with masterclass player, expertise domains, catalogue, testimonials, stats |
| `/about` | `app/(marketing)/about/` | Founder biography, field photo gallery |
| `/contact` | `app/(marketing)/contact/` | Contact form (front-end validation only) |
| `/livres` | `app/(marketing)/livres/` | Books page with 3D book covers |
| `/courses`, `/courses/[slug]` | `app/(catalog)/`, `components/catalog/` | Catalogue with filters and pagination, course detail, curriculum, price/currency |
| `/instructors/[id]` | `app/(catalog)/instructors/[id]/` | Instructor profile |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | `app/(auth)/`, `components/auth/` | Auth screens |
| `/account`, `/learn`, `/teach`, `/admin` | `app/(app)/` | Logged-in screens (placeholders) |
| Shared on every page | `app/layout.tsx`, `app/components/Navbar.tsx`, `Footer.tsx`, `PageLoader.tsx`, `ScrollToTop.tsx` | Header, mobile drawer, footer |

## 3. The design system

**Start with `app/globals.css`.** If the existing site takes only one file, it should be this one.

- **Tokens** (top of the file, `:root`): brand colours from the logo (`--brand-orange #f7941d`,
  `--brand-orange-deep #f15a29`, `--brand-green #39b54a`, `--brand-teal #00a79d`, `--brand-charcoal #414042`),
  text/background/border colours, shadows, `--max-width: 1600px`, `--gutter`, `--nav-height: 90px`, and the two
  easing curves. Copy the whole `:root` block as-is. Everything else refers to these variables.
- **Fonts**: [Marcellus](https://fonts.google.com/specimen/Marcellus) (headings, figures; one weight only) and
  [Outfit](https://fonts.google.com/specimen/Outfit) (all other text). The site loads them in `app/layout.tsx` and
  exposes them as `--font-display` and `--font-body`. On a site that isn't built with Next.js, load them from
  Google Fonts and set those two variables yourself:
  ```css
  :root { --font-display: 'Marcellus'; --font-body: 'Outfit'; }
  ```
- **Typography**: fluid sizes with `clamp()`, under the `TYPOGRAPHY` section (`h1`–`h3`, `.text-lead`, gradient text).
- **Layout**: `.container`, `.section`, and the shared components (buttons, cards, nav, footer, hero) live further down in
  the same file, each under its own commented header.
- **Breakpoints**: 1200, 1024, 860, 768 and 560 px (max-width), plus `(hover: hover)`, `(pointer: coarse)` for
  touch targets and `(prefers-reduced-motion: reduce)`. Keep the reduced-motion rules.
- **Theme**: the site is light-only.
- **Page-specific styles**: in the `*.module.css` file next to each page or component. CSS Modules rename classes
  at build time, so in a non-React site these become plain class names. Copy the rules and keep the names.

## 4. Assets

Everything is in `public/`: photos, logos and the hero videos (`video_2026-09-29_*.mp4`). Copy the files that the
ported pages use. The five videos total about 31 MB, so serve them from a CDN or video host if the existing site has one.

## 5. What is demo-only and needs wiring to the real site

- **Catalogue data**: `lib/data/seed-data.ts` (8 courses, 10 domains) and `lib/data/types.ts`. The types show the
  shape of data the UI expects. Map the existing site's courses onto them, or adapt the components.
- **Forms** (login, signup, account): validation is in `lib/auth/schemas.ts` (zod). Submissions in
  `app/(auth)/actions.ts` and `app/(app)/account/actions.ts` currently return a "version de démonstration" message
  instead of saving anything. Connect them to the existing site's endpoints.
- **Contact form** (`app/(marketing)/contact/ContactForm.tsx`) opens the visitor's email client with a `mailto:`
  link. Replace it with the site's own form handling if it has one.
- **Auth state in the header**: `app/components/AuthStatus.tsx` always renders as logged out. Replace it with the
  real session.
- **Currency conversion**: `lib/money/`. Rates are fetched in the browser from a public API, with the fixed CFA
  franc parities as a fallback. Keep it or replace it with the site's own pricing.

## 6. Interactive behaviour (JavaScript)

These parts need client-side JS. In React they can be reused almost as they are. On any other stack, rewrite them
with the source as the specification:

- `Hero.tsx`: film playlist, progress, mute/play controls, masterclass player
- `HomeEffects.tsx` + `app/hooks.ts`: scroll reveal animations, counting stats, image parallax
- `Navbar.tsx` / `NavOnMedia.tsx`: transparent nav over the hero that turns solid on scroll; mobile drawer
- `PageLoader.tsx`, `ScrollToTop.tsx`
- `about/FieldGallery.tsx`, `livres/Book.tsx`
- `components/catalog/CatalogFilters.tsx`, `Price.tsx`, `CurrencySelector.tsx`

## 7. Suggested approach

1. Copy the `:root` tokens, the fonts and the base/typography sections of `globals.css` into the existing site.
   Check that nothing in the existing CSS conflicts, especially the global reset at the top of `globals.css`.
2. Port the header and footer, since they appear on every page.
3. Port the pages one at a time, starting with the home page, and compare each against `npm run dev` at desktop
   and at 375 px wide.
4. Wire the forms and data to the existing backend last.

Checks available in this repo: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
