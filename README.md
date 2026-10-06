# Proactive Académie

Proactive Académie is the learning platform of Proactive Services: a catalogue of professional training courses (international trade, finance, logistics) that visitors can browse and search, learners can enrol in, and instructors will be able to publish. Phase 1 (foundation) ships authentication, the public catalogue, course and instructor pages, and the learner, instructor, admin and account areas. Built with Next.js 16, TypeScript, Supabase (Auth, Postgres, Storage) and Drizzle.

## Prerequisites

- Node.js 20.9 or newer
- A Supabase project (Postgres connection strings and API keys)

## Setup

1. `cp .env.example .env.local` and fill in the values (never commit `.env.local`).
2. `npm install`
3. `npm run db:migrate` — applies the Drizzle migrations, including the hand-written RLS in `drizzle/0001`.
4. `npm run db:storage` — creates the storage buckets and policies.
5. `npm run db:seed` — seeds categories, a house instructor and sample courses.
6. In the Supabase dashboard, configure Auth:
   - Site URL = `NEXT_PUBLIC_SITE_URL`, and add `<site url>/auth/callback` to the redirect URLs.
   - Optional: enable the Google provider.
   - SMTP via Resend (Auth > SMTP settings).
   - Turn on "Secure password change" and keep email confirmation ON (it prevents account enumeration on signup).
7. `npm run dev`

Never run `drizzle-kit push`: the RLS policies live in hand-written SQL (`drizzle/0001`) and `push` would not apply them.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (needs a reachable database) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and PGlite tests |
| `npm run test:e2e` | Playwright smoke tests (needs a build and a seeded DB; set `E2E_EMAIL` / `E2E_PASSWORD` for the login test) |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:storage` | Apply `supabase/storage.sql` |
| `npm run db:seed` | Seed sample data |

First run of the e2e suite: `npx playwright install chromium`.

## Promote an admin

In the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<uuid>';
```

## Status / pending

- The database is not yet connected in the build environment: `DATABASE_URL` / `DIRECT_DATABASE_URL` must be set. Then run `npm run db:migrate`, `npm run db:storage`, `npm run db:seed`, and rerun `npm run build` and `npm run test:e2e` (both were skipped for lack of a DB).
- Supabase dashboard settings still to configure: Site URL and the `/auth/callback` redirect URL; Google provider (optional); SMTP via Resend; "Secure password change"; email confirmation kept ON.
- `npm run typecheck` runs `next typegen` first (route types are generated).

## Docs

- Spec: `docs/superpowers/specs/2026-10-05-lms-foundation-design.md`
- Plan: `docs/superpowers/plans/2026-10-05-lms-foundation.md`
