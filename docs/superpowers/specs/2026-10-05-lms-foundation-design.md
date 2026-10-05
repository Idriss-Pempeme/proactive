# Proactive Academy LMS — Programme Roadmap & Phase 1 (Foundation) Design

Date: 2026-10-05
Status: Approved for planning (decisions delegated to Claude as project manager)

## 1. Intent

Turn the existing Proactive Services marketing site into a production-grade,
Udemy-style multi-instructor course marketplace with a premium ("masterclass")
look and feel. Quality bar: what a ~80k USD agency build would deliver —
correct money handling, real security boundaries, tests, polished UI — not a
larger feature list.

### What the user decided
- Business model: **marketplace (style A)** — courses sold individually; Proactive
  sells its own courses (keeps 100 %) and approved external instructors sell
  theirs (platform keeps a configurable commission, default 30 %).
- Payments: **Stripe only** (no Flutterwave / Mobile Money for now).
- **No mobile app** for now.
- Currency: **prices stored and charged in EUR**; visitors additionally see an
  approximate price in their local currency, chosen from their location.
- Stack: **Supabase for everything** (Auth + Postgres + Storage).
- All further decisions delegated to Claude.

### Assumptions (made by Claude, overridable)
- UI language is **French** (the existing site is French). Copy is centralised
  so English can be added later; no i18n routing in Phase 1.
- Existing pages (home, about, livres) and the emerald/gold dark/light design
  system are kept and extended, not redesigned.
- The 8 hardcoded courses on the home page become seed data owned by the
  Proactive Services "house" instructor account.

## 2. Programme roadmap

Each phase gets its own spec → plan → implementation cycle. Later phases are
outlined only; they are designed in detail when they start.

| Phase | Scope | Depends on |
|---|---|---|
| **1. Foundation** (this spec) | TypeScript migration, Supabase auth + roles, DB schema for users/courses/curriculum/enrollments, public catalog (search, filters, sort), course detail page, instructor public profile, location-based currency display, signed-in shells | — |
| 2. Authoring & learning | Instructor course builder (sections, Mux video lessons, text lessons, quizzes), submit-for-review, admin approve/reject, course player, progress tracking, completion certificates (PDF), "Devenir formateur" application flow | 1 |
| 3. Payments | Stripe Checkout + Stripe Connect Express (destination charges, `application_fee_amount` = commission), admin-set commission rate, webhooks → enrollment, receipts/invoices via Stripe, refunds (30-day window), instructor onboarding + payouts. Evaluate Stripe Adaptive Pricing compatibility with Connect | 1, 2 |
| 4. Dashboards & social proof | Admin finance dashboard + user management, instructor revenue/statistics, student "Mon apprentissage", reviews & ratings | 2, 3 |
| 5. Hardening & launch | Security review, rate limiting (Upstash), Sentry, SEO + JSON-LD, analytics, e2e suite expansion, production deploy | all |

## 3. Phase 1 architecture

### Stack
- Next.js 16 App Router, React 19, **TypeScript (strict)**. Existing `.js` files
  are converted. Middleware is `proxy.ts` in Next 16.
- `cacheComponents: true`; public catalog data cached with `"use cache"` +
  `cacheTag`, invalidated via `revalidateTag` from mutations.
- Supabase: Auth (`@supabase/ssr` cookie sessions), Postgres, Storage
  (course thumbnails, avatars).
- **Drizzle ORM** + drizzle-kit migrations (SQL files committed). RLS policies
  are written in the migrations.
- Zod for all input validation (search params, forms, server actions).
- Styling: keep the existing token system in `globals.css`; new components use
  **CSS Modules** consuming those tokens. No Tailwind (avoids two competing
  systems).
- Tests: **Vitest** (units + DB queries against **PGlite**, in-process Postgres,
  no Docker required), **Playwright** smoke e2e.
- Hosting: Vercel. Dev uses a hosted Supabase project (no Docker on dev machine).

### Directory layout
```
app/
  (marketing)/            page.tsx (home), about/, livres/  — existing pages moved
  (catalog)/
    courses/page.tsx              catalog
    courses/[slug]/page.tsx       course detail
    instructors/[id]/page.tsx     instructor profile
  (auth)/
    login/, signup/, forgot-password/, reset-password/
    auth/callback/route.ts        OAuth / email-link exchange
  (app)/                          signed-in, dynamic
    learn/page.tsx                student home (stub: enrolled courses list)
    teach/page.tsx                instructor home (stub)
    admin/page.tsx                admin home (stub: counts)
    account/page.tsx              profile edit
  components/                     shared UI (Navbar, Footer, CourseCard, Price, ...)
lib/
  db/schema.ts, db/client.ts, db/queries/*.ts   (import 'server-only')
  auth/session.ts                 getUser(), getProfile(), requireRole()
  supabase/server.ts, browser.ts  @supabase/ssr clients
  money/format.ts                 EUR cents → display strings
  money/rates.ts                  ECB daily rates (cached 12h)
  geo/currency.ts                 country → currency, cookie override
drizzle/                          generated SQL migrations + rls.sql
proxy.ts                          session refresh + optimistic redirects
```

### Security model
- `proxy.ts` refreshes the Supabase session cookie and does **optimistic**
  redirects only (anonymous user hitting `/learn|/teach|/admin|/account` → `/login?next=`).
- Real authorization happens server-side: every signed-in page and every
  server action calls `requireRole(...)`, which reads the role from
  `profiles` (never from user-editable auth metadata).
- RLS enabled on every table as defence in depth (see §4).
- The Drizzle client connects with a server-only connection string; the
  service-role key is never exposed to the browser. Browser Supabase client is
  used only for auth flows.
- Roles change only via admin action (Phase 4 UI; Phase 1 via seed/SQL).

## 4. Data model (Phase 1 tables)

All money is **integer cents, EUR**. All ids `uuid`. Timestamps `timestamptz`.

**profiles** — 1:1 with `auth.users`, created by trigger on signup.
`id (pk, fk auth.users)`, `display_name`, `avatar_path`, `headline`, `bio`,
`role` enum(`student`,`instructor`,`admin`) default `student`,
`is_house` bool default false (Proactive's own account; commission 0 in Phase 3),
`country` char(2) null, `created_at`, `updated_at`.

**categories** — `id`, `slug` unique, `name`, `position`.
Seed: Négoce, Import-Export, Logistique, Finance, Douane, Juridique,
Agriculture, Qualité, Stratégie, Sourcing.

**courses** — `id`, `slug` unique, `instructor_id → profiles`,
`category_id → categories`, `title`, `subtitle`, `description` (markdown),
`outcomes text[]` ("ce que vous apprendrez"), `requirements text[]`,
`level` enum(`beginner`,`intermediate`,`advanced`,`all`),
`language` default `fr`, `price_cents int ≥ 0` (0 = free),
`status` enum(`draft`,`in_review`,`published`,`rejected`,`archived`),
`thumbnail_path`, `promo_playback_id` null (Mux, Phase 2),
`published_at`, denormalised `rating_avg numeric(2,1)`, `rating_count int`,
`enrollment_count int`, `total_duration_seconds int`, `lesson_count int`,
`search tsvector` generated (french config, title A, subtitle B, description C)
with GIN index, `created_at`, `updated_at`.

**sections** — `id`, `course_id`, `position`, `title`. Unique (course_id, position).

**lessons** — `id`, `section_id`, `position`, `title`,
`kind` enum(`video`,`text`,`quiz`), `is_preview` bool, `duration_seconds`,
`mux_playback_id` null, `body` null. Unique (section_id, position).
Phase 1 only reads titles/durations/preview flags for the curriculum outline.

**enrollments** — `id`, `user_id`, `course_id`, `source`
enum(`purchase`,`free`,`admin`), `created_at`. Unique (user_id, course_id).
Phase 3 adds `order_id`.

Deliberately **not** in Phase 1 (added by their phase's migration):
orders, payouts, platform settings/commission, reviews, progress, quizzes,
certificates, instructor applications.

### RLS policies
- profiles: anyone can read public columns via a `public_profiles` view
  (display_name, avatar_path, headline, bio, id); owner can update own row
  except `role`/`is_house` (enforced by trigger); admin full access.
- categories: public read; admin write.
- courses/sections/lessons: public read when course `status = 'published'`;
  owning instructor reads/writes own; admin full.
- enrollments: owner reads own; instructor reads enrollments of own courses;
  inserts only by server (service connection) — never from the browser.

## 5. Features

### Auth
- Email + password (with email confirmation), magic link, Google OAuth.
- Forgot/reset password. Supabase SMTP configured to Resend (config, not code).
- `next` param preserved through login so "Acheter" → login → back to course.
- Navbar shows avatar menu (Mon apprentissage / Espace formateur (instructors) /
  Administration (admins) / Mon compte / Déconnexion) when signed in.

### Catalog `/courses`
- Server-rendered; all state in URL search params (shareable, back-button safe):
  `q`, `category`, `level`, `price` (`free|paid`), `sort`
  (`popular` default = enrollment_count, `rating`, `newest`, `price_asc`,
  `price_desc`), `page` (24 per page).
- Search = Postgres full-text (`websearch_to_tsquery('french', q)`), ranked,
  combined with filters.
- Filter sidebar (drawer on mobile), result count, empty state with reset.
- CourseCard: thumbnail, category, title, instructor, rating stars + count,
  duration, level, price (EUR + approx local).

### Course detail `/courses/[slug]`
- Hero: title, subtitle, rating, enrollment count, instructor, last updated,
  language, level.
- Sticky purchase card: thumbnail/promo placeholder, price, CTA. Phase 1 CTA
  states: not signed in → "Se connecter pour s'inscrire"; enrolled →
  "Accéder au cours"; free → "S'inscrire gratuitement" (creates enrollment);
  paid → "Acheter" disabled with "Paiement bientôt disponible" (wired in Phase 3).
- "Ce que vous apprendrez", requirements, description (sanitised markdown),
  curriculum accordion (sections → lessons with duration and "Aperçu" badge),
  instructor card, rating summary placeholder (reviews in Phase 4).
- `generateMetadata` with title/description/OG image; 404 for unpublished
  (except owner/admin preview).

### Instructor profile `/instructors/[id]`
- Avatar, headline, bio, stats (courses, students, avg rating), their
  published courses grid.

### Home page
- Existing hero/sections kept; the hardcoded course grid becomes
  "Formations populaires" from DB (top 8 by enrollment); stats counters read
  real counts (courses, students, instructors) with cached query.
- "Devenir formateur" CTA links to `/teach` (signed in) or signup.

### Currency display
- Charge currency is always EUR. Display rule: `49 €` and, when the visitor's
  currency ≠ EUR, a muted `≈ 53 $US` after it, plus a footnote tooltip
  "Montant indicatif. Paiement en euros."
- Visitor currency resolved: cookie `display_currency` (set via a selector in
  the footer) → `x-vercel-ip-country` header → country→currency map → EUR
  fallback. Supported display currencies: EUR, USD, GBP, CHF, CAD, XOF, XAF,
  MAD, NGN, GHS, KES, ZAR (others fall back to USD).
- Rates: ECB daily reference XML (free, EUR-based), fetched with `"use cache"`
  `cacheLife` ~12 h; XOF/XAF use the fixed peg (655.957 per EUR) independently
  of the feed. On fetch failure: show EUR only (never block rendering).
- Rounding: whole units for all display currencies (approximate by design).

### Signed-in shells
- `/learn`: enrolled courses list (cards linking to course page; player in Phase 2).
- `/teach`: instructor-only; "Vos cours" list with status badges (builder Phase 2).
  Students see a "Devenir formateur" explainer.
- `/admin`: admin-only; counts of users/courses/enrollments.
- `/account`: edit display name, headline, bio, avatar upload (Storage, ≤ 2 MB,
  jpg/png/webp).

## 6. Error handling
- `error.tsx` per route group with branded fallback; `not-found.tsx` kept.
- Server actions return typed `{ ok: true, data } | { ok: false, error }`;
  forms display field errors from Zod.
- External dependency failures (ECB rates, Storage image) degrade gracefully;
  DB failures surface the error boundary and are logged (Sentry in Phase 5).

## 7. Testing
- Vitest units: money formatting, conversion + rounding + peg, country→currency
  resolution, search-param parsing (Zod), requireRole.
- Vitest + PGlite: catalog query (search, each filter, each sort, pagination),
  course-by-slug visibility rules, enrollment uniqueness, profile-creation
  trigger. RLS itself is verified against the hosted dev project with a
  scripted check (PGlite lacks Supabase's auth schema).
- Playwright smoke: home renders popular courses; catalog search + filter;
  course page curriculum expands; signup → login → `/learn`; anonymous
  `/admin` redirects to login.
- `npm run typecheck`, `lint`, `test`, `build` all green before a phase is done.

## 8. Out of scope for Phase 1
Payments, video playback, course builder, quizzes, progress, certificates,
reviews, admin management UIs, emails beyond Supabase auth emails, mobile app,
Flutterwave, English UI.

## 9. External setup the owner must provide
- Supabase project (URL, anon key, service role key, DB connection string),
  Google OAuth client (optional; email auth works without it).
- Later phases: Stripe account (Connect enabled), Mux, Resend, Vercel.
