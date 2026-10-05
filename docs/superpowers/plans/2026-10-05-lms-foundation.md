# Proactive Academy LMS — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static Proactive Services site into the foundation of a course marketplace: TypeScript, Supabase auth with roles, a real course database, a searchable catalog, course and instructor pages, location-based approximate pricing, and signed-in shells.

**Architecture:** Next.js 16 App Router with Cache Components. Public catalog data is read through `"use cache"` wrappers around plain query functions that take a `db` argument (so the same queries run against PGlite in tests and Supabase Postgres in production). Auth is Supabase via `@supabase/ssr`; roles live in `public.profiles` and are enforced server-side by `requireRole()` with RLS as a backstop. Visitor currency is resolved in `proxy.ts` into a cookie and applied client-side so pages stay cacheable.

**Tech Stack:** Next.js 16.3.6, React 19.2.8, TypeScript 5.9.3, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Drizzle ORM + drizzle-kit, `postgres` driver, Zod 4, Vitest + PGlite, Playwright, `marked` + `sanitize-html`, `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-05-lms-foundation-design.md`

## Global Constraints

- Before using any Next.js API, read its page under `node_modules/next/dist/docs/` — this is Next 16; middleware is `proxy.ts`, `params`/`searchParams`/`cookies()`/`headers()` are async, `revalidateTag(tag, profile)` needs two arguments, `updateTag(tag)` is for Server Actions.
- `cacheComponents: true`. Any component that reads `cookies()`, `headers()`, `params` or `searchParams` must render inside `<Suspense>`. Uncached DB reads also go inside `<Suspense>`.
- TypeScript pinned to `5.9.3` (not 7.x). `strict: true`.
- All money is integer cents in EUR. Never use floats for stored amounts.
- UI copy is French. Use `fr-FR` for `Intl` formatting.
- Styling: tokens from `app/globals.css` + CSS Modules. **No Tailwind.** Small one-off inline layout styles are acceptable; anything reused or stateful goes in a CSS Module.
- `lib/db/*`, `lib/auth/session.ts`, `lib/supabase/server.ts`, `lib/catalog/cached.ts` start with `import 'server-only'`.
- A user's role is read only from `public.profiles.role`, never from Supabase `user_metadata`.
- Env var names (exact): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` (transaction pooler, port 6543), `DIRECT_DATABASE_URL` (session/direct, port 5432), `NEXT_PUBLIC_SITE_URL`.
- Commit after every task with a conventional message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Hostile or odd search input** (`q` = `"`, `&|!`, `l'export`, 500 chars, only stopwords) → results or empty state, never a 500. Test lives in Task 5.
2. **Garbage URL params** (`page=-3`, `page=abc`, `sort=drop`, `category=../x`, repeated params) → silently fall back to defaults. Test lives in Task 5.
3. **Open redirect via `next`** (`//evil.com`, `https://evil.com`, `/\evil.com`) on login/callback → always a same-site path. Test lives in Task 6.
4. **Direct calls to the enroll action** for a paid, unpublished, or already-enrolled course → rejected or idempotent, counter not double-incremented. Test lives in Task 10.
5. **Rates API down / tampered `display_currency` cookie** → EUR only, no crash, no injected text. Tests live in Task 2 (parsing/validation) and Task 8 (hook ignores invalid cookie).

## Owner prerequisites (needed from Task 4 on for live runs)

Create a Supabase project and put these in `.env.local` (never commit it):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Tasks 1–3, 5, 6 (unit parts), 8 are fully verifiable without it (PGlite). `npm run build` from Task 12 onward prerenders DB-backed content and needs it.

## File map

```
next.config.ts, tsconfig.json, eslint.config.mjs, vitest.config.ts, playwright.config.ts, drizzle.config.ts
proxy.ts                                   session refresh, protected redirects, currency cookie
app/layout.tsx                             root layout (Navbar auth slots, Footer)
app/(marketing)/page.tsx                   home (server) + HomeEffects (client)
app/(marketing)/about/*, livres/*          moved existing pages
app/(catalog)/courses/page.tsx             catalog
app/(catalog)/courses/[slug]/page.tsx      course detail (+ actions.ts)
app/(catalog)/instructors/[id]/page.tsx    instructor profile
app/(auth)/login|signup|forgot-password|reset-password/page.tsx, actions.ts
app/auth/callback/route.ts                 code / token_hash exchange
app/(app)/learn|teach|admin|account/page.tsx
app/api/rates/route.ts                     cached EUR rates JSON
app/components/…                           Navbar, Footer, AuthStatus, UserMenu, CurrencySelector
components/catalog/…                       CourseCard, Price, Stars, CatalogFilters, Pagination, Curriculum
components/auth/…                          AuthCard, form components
lib/money/{currencies,format,rates}.ts     currency rules
lib/db/{schema,client,types}.ts            Drizzle
lib/db/queries/{catalog,enrollment,profile}.ts
lib/catalog/{params,href,cached}.ts
lib/auth/{roles,schemas,errors,session}.ts
lib/supabase/{env,server,browser}.ts
lib/{media,markdown,duration,labels}.ts
drizzle/0000_*.sql (generated), drizzle/0001_rls_and_triggers.sql (custom)
supabase/storage.sql                       buckets + storage policies (hosted only)
scripts/{seed,apply-sql}.ts, lib/db/seed-data.ts
tests/db/{harness,factories}.ts, tests/stubs/server-only.ts, e2e/smoke.spec.ts
```

---

### Task 1: TypeScript, Cache Components, test and lint tooling

Converts the repo to TypeScript, moves existing pages into a `(marketing)` route group, enables Cache Components, and installs Vitest/ESLint. No behaviour change.

**Files:**
- Rename (git mv): every `app/**/*.js` → `.tsx` (`app/hooks.js` → `app/hooks.ts`); `jsconfig.json` → delete; `next.config.mjs` → `next.config.ts`
- Move: `app/page.tsx` → `app/(marketing)/page.tsx`; `app/about/` → `app/(marketing)/about/`; `app/livres/` → `app/(marketing)/livres/`
- Create: `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `tests/stubs/server-only.ts`, `lib/sanity.test.ts`
- Modify: `package.json`, `.gitignore`, `app/components/Footer.tsx`

**Interfaces:**
- Produces: `npm run typecheck | lint | test | build` scripts; `@/` path alias to repo root; Vitest aliasing `server-only` to a stub.

- [ ] **Step 1: Install dependencies**

```bash
npm i @supabase/ssr @supabase/supabase-js drizzle-orm postgres zod marked sanitize-html server-only
npm i -D typescript@5.9.3 @types/react @types/react-dom @types/node @types/sanitize-html drizzle-kit @electric-sql/pglite vitest tsx eslint eslint-config-next@16.3.6 @playwright/test
```

- [ ] **Step 2: Rename and move files**

```bash
git mv app/page.js "app/(marketing)/page.tsx"   # create folder first: mkdir -p "app/(marketing)"
git mv app/about "app/(marketing)/about"
git mv app/livres "app/(marketing)/livres"
git mv "app/(marketing)/about/page.js" "app/(marketing)/about/page.tsx"
git mv "app/(marketing)/about/layout.js" "app/(marketing)/about/layout.tsx"
git mv "app/(marketing)/livres/page.js" "app/(marketing)/livres/page.tsx"
git mv app/layout.js app/layout.tsx
git mv app/not-found.js app/not-found.tsx
git mv app/hooks.js app/hooks.ts
for f in ContactForm Footer HeroSlider Navbar PageLoader ScrollToTop; do git mv app/components/$f.js app/components/$f.tsx; done
git mv next.config.mjs next.config.ts
git rm jsconfig.json
```

Fix relative imports broken by the move: in `app/(marketing)/page.tsx` change `'./hooks'` → `'@/app/hooks'` and `'./components/HeroSlider'` → `'@/app/components/HeroSlider'`; same treatment for `about/page.tsx` and `livres/page.tsx` (`'../hooks'` → `'@/app/hooks'`, `'../components/…'` → `'@/app/components/…'`).

- [ ] **Step 3: Write config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
(If `next build` rewrites `jsx` or `include`, accept its rewrite.)

`next.config.ts`:
```ts
import type { NextConfig } from 'next';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    qualities: [75, 100],
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

export default nextConfig;
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
```

`tests/stubs/server-only.ts`:
```ts
export {};
```

`eslint.config.mjs`:
```js
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'playwright-report/**', 'test-results/**'] },
];
```

`package.json` scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:storage": "tsx --env-file=.env.local scripts/apply-sql.ts supabase/storage.sql",
  "db:seed": "tsx --env-file=.env.local scripts/seed.ts"
}
```

Append to `.gitignore`:
```
/playwright-report
/test-results
```

- [ ] **Step 4: Write a sanity test, run it**

`lib/sanity.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

describe('tooling', () => {
  it('runs TypeScript tests with the @ alias', async () => {
    const mod = await import('@/tests/stubs/server-only');
    expect(mod).toBeDefined();
  });
});
```
Run: `npm test` — Expected: 1 passed.

- [ ] **Step 5: Make the codebase typecheck**

Run: `npm run typecheck`. Fix every error with minimal, honest types (no `any` unless the value is truly untyped DOM data — prefer `unknown` + narrowing). Typical fixes: event handler params (`(e: KeyboardEvent)`, `(e: MediaQueryListEvent)`), `isActive = (href: string) =>`, `useRef<HTMLDivElement>(null)`, `querySelectorAll<HTMLElement>(…)` in `app/hooks.ts`, component props interfaces.

Make `Footer` cache-safe under Cache Components (it calls `new Date()`):
```tsx
import Link from 'next/link';
import { cacheLife } from 'next/cache';

export default async function Footer() {
  'use cache';
  cacheLife('days');
  const year = new Date().getFullYear();
  // …existing JSX, with {year} replacing {new Date().getFullYear()}
}
```
Expected: `npm run typecheck` exits 0.

- [ ] **Step 6: Lint and build**

Run: `npm run lint` — fix errors (warnings allowed; do not disable rules globally).
Run: `npm run build` — Expected: success. If the build reports a blocking-route / sync-IO error, wrap the offending runtime read in `<Suspense>` per `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.
Run `npm run dev` and open `/`, `/about`, `/livres` — they render as before.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: migrate to TypeScript, enable Cache Components, add Vitest and ESLint"
```

---

### Task 2: Money and currency rules

Pure modules: EUR formatting, approximate local display, country→currency, rates parsing, and the cached `/api/rates` route.

**Files:**
- Create: `lib/money/currencies.ts`, `lib/money/format.ts`, `lib/money/rates.ts`, `app/api/rates/route.ts`
- Test: `lib/money/currencies.test.ts`, `lib/money/format.test.ts`, `lib/money/rates.test.ts`

**Interfaces:**
- Produces:
  - `type DisplayCurrency = 'EUR'|'USD'|'GBP'|'CHF'|'CAD'|'XOF'|'XAF'|'MAD'|'NGN'|'GHS'|'KES'|'ZAR'`
  - `DISPLAY_CURRENCIES: readonly DisplayCurrency[]`, `CFA_PER_EUR = 655.957`
  - `isDisplayCurrency(v: unknown): v is DisplayCurrency`
  - `countryToCurrency(country: string | null | undefined): DisplayCurrency`
  - `formatEur(cents: number): string` (`0` → `'Gratuit'`)
  - `formatApprox(cents: number, currency: DisplayCurrency, rate: number | undefined): string | null`
  - `type Rates = Partial<Record<DisplayCurrency, number>>`, `parseRates(json: unknown): Rates`, `fetchRates(fetchImpl?: typeof fetch): Promise<Rates>`
  - `GET /api/rates` → `Rates` JSON

- [ ] **Step 1: Write failing tests**

`lib/money/currencies.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { countryToCurrency, isDisplayCurrency } from './currencies';

describe('countryToCurrency', () => {
  it.each([
    ['BE', 'EUR'], ['fr', 'EUR'], ['US', 'USD'], ['GB', 'GBP'], ['CH', 'CHF'], ['CA', 'CAD'],
    ['CI', 'XOF'], ['SN', 'XOF'], ['CM', 'XAF'], ['GA', 'XAF'], ['MA', 'MAD'], ['NG', 'NGN'],
    ['GH', 'GHS'], ['KE', 'KES'], ['ZA', 'ZAR'], ['IN', 'USD'], ['BR', 'USD'],
  ])('%s → %s', (country, expected) => {
    expect(countryToCurrency(country)).toBe(expected);
  });

  it('falls back to EUR when the country is unknown or malformed', () => {
    expect(countryToCurrency(null)).toBe('EUR');
    expect(countryToCurrency(undefined)).toBe('EUR');
    expect(countryToCurrency('')).toBe('EUR');
    expect(countryToCurrency('XX1')).toBe('EUR');
    expect(countryToCurrency('<script>')).toBe('EUR');
  });
});

describe('isDisplayCurrency', () => {
  it('accepts supported codes only', () => {
    expect(isDisplayCurrency('USD')).toBe(true);
    expect(isDisplayCurrency('usd')).toBe(false);
    expect(isDisplayCurrency('JPY')).toBe(false);
    expect(isDisplayCurrency('<img onerror=x>')).toBe(false);
    expect(isDisplayCurrency(undefined)).toBe(false);
  });
});
```

`lib/money/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatApprox, formatEur } from './format';

// Intl uses narrow/no-break spaces; normalise for readable assertions.
const n = (s: string | null) => (s === null ? null : s.replace(/\s/g, ' '));

describe('formatEur', () => {
  it('formats whole euros without decimals', () => expect(n(formatEur(4900))).toBe('49 €'));
  it('keeps cents when present', () => expect(n(formatEur(4999))).toBe('49,99 €'));
  it('groups thousands', () => expect(n(formatEur(120000))).toBe('1 200 €'));
  it('shows Gratuit for free', () => expect(formatEur(0)).toBe('Gratuit'));
});

describe('formatApprox', () => {
  it('converts and rounds to whole units', () => {
    expect(n(formatApprox(4900, 'USD', 1.08))).toBe('≈ 53 $US');
  });
  it('uses the CFA peg value it is given', () => {
    expect(n(formatApprox(4900, 'XOF', 655.957))).toMatch(/^≈ 32 142 /);
  });
  it('returns null for EUR, free courses, and unusable rates', () => {
    expect(formatApprox(4900, 'EUR', 1)).toBeNull();
    expect(formatApprox(0, 'USD', 1.08)).toBeNull();
    expect(formatApprox(4900, 'USD', undefined)).toBeNull();
    expect(formatApprox(4900, 'USD', Number.NaN)).toBeNull();
    expect(formatApprox(4900, 'USD', -1)).toBeNull();
  });
});
```

`lib/money/rates.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { CFA_PER_EUR } from './currencies';
import { fetchRates, parseRates } from './rates';

const good = {
  result: 'success',
  base_code: 'EUR',
  rates: { EUR: 1, USD: 1.08, GBP: 0.85, NGN: 1650.5, JPY: 160, KES: 'oops', MAD: -2 },
};

describe('parseRates', () => {
  it('keeps supported, positive, numeric rates and pins CFA to the peg', () => {
    const r = parseRates(good);
    expect(r).toMatchObject({ EUR: 1, USD: 1.08, GBP: 0.85, NGN: 1650.5, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
    expect(r).not.toHaveProperty('JPY');
    expect(r).not.toHaveProperty('KES');
    expect(r).not.toHaveProperty('MAD');
  });

  it('returns only the fixed rates for malformed payloads', () => {
    for (const bad of [null, 'x', {}, { result: 'error' }, { ...good, base_code: 'USD' }, { ...good, rates: null }]) {
      expect(parseRates(bad)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
    }
  });
});

describe('fetchRates', () => {
  it('degrades to fixed rates when the network fails', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    expect(await fetchRates(failing)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
  });

  it('degrades on non-200', async () => {
    const notOk = vi.fn().mockResolvedValue(new Response('nope', { status: 503 })) as unknown as typeof fetch;
    expect(await fetchRates(notOk)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
  });

  it('parses a good response', async () => {
    const ok = vi.fn().mockResolvedValue(Response.json(good)) as unknown as typeof fetch;
    expect((await fetchRates(ok)).USD).toBe(1.08);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/money` — Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`lib/money/currencies.ts`:
```ts
export const DISPLAY_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'XOF', 'XAF', 'MAD', 'NGN', 'GHS', 'KES', 'ZAR',
] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Fixed parity of the CFA francs (UEMOA and CEMAC) to the euro. */
export const CFA_PER_EUR = 655.957;

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
  'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK',
  // French overseas departments report their own ISO codes
  'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF',
]);
const XOF_COUNTRIES = new Set(['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']);
const XAF_COUNTRIES = new Set(['CM', 'CF', 'TD', 'CG', 'GQ', 'GA']);
const SINGLE: Record<string, DisplayCurrency> = {
  US: 'USD', GB: 'GBP', CH: 'CHF', LI: 'CHF', CA: 'CAD', MA: 'MAD',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === 'string' && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

/** Visitor country (ISO 3166-1 alpha-2) → currency shown next to EUR prices. */
export function countryToCurrency(country: string | null | undefined): DisplayCurrency {
  if (!country) return 'EUR';
  const code = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return 'EUR';
  if (EUR_COUNTRIES.has(code)) return 'EUR';
  if (XOF_COUNTRIES.has(code)) return 'XOF';
  if (XAF_COUNTRIES.has(code)) return 'XAF';
  return SINGLE[code] ?? 'USD';
}
```

`lib/money/format.ts`:
```ts
import type { DisplayCurrency } from './currencies';

const eurWithCents = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurWhole = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

export function formatEur(cents: number): string {
  if (cents === 0) return 'Gratuit';
  return cents % 100 === 0 ? eurWhole.format(cents / 100) : eurWithCents.format(cents / 100);
}

/** Indicative local price, or null when there is nothing useful to show. */
export function formatApprox(
  cents: number,
  currency: DisplayCurrency,
  rate: number | undefined,
): string | null {
  if (currency === 'EUR' || cents === 0) return null;
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return null;
  const amount = Math.round((cents / 100) * rate);
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
  return `≈ ${formatted}`;
}
```

`lib/money/rates.ts`:
```ts
import { CFA_PER_EUR, DISPLAY_CURRENCIES, type DisplayCurrency } from './currencies';

export type Rates = Partial<Record<DisplayCurrency, number>>;

const RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
const FIXED: Rates = { EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR };

export function parseRates(json: unknown): Rates {
  const out: Rates = { ...FIXED };
  if (typeof json !== 'object' || json === null) return out;
  const payload = json as { result?: unknown; base_code?: unknown; rates?: unknown };
  if (payload.result !== 'success' || payload.base_code !== 'EUR') return out;
  if (typeof payload.rates !== 'object' || payload.rates === null) return out;
  const rates = payload.rates as Record<string, unknown>;
  for (const code of DISPLAY_CURRENCIES) {
    if (code in FIXED) continue;
    const value = rates[code];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[code] = value;
  }
  return out;
}

export async function fetchRates(fetchImpl: typeof fetch = fetch): Promise<Rates> {
  try {
    const res = await fetchImpl(RATES_URL);
    if (!res.ok) return parseRates(null);
    return parseRates(await res.json());
  } catch {
    return parseRates(null);
  }
}
```

`app/api/rates/route.ts` (read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md` first):
```ts
import { cacheLife } from 'next/cache';
import { fetchRates } from '@/lib/money/rates';

async function getRates() {
  'use cache';
  cacheLife({ stale: 3600, revalidate: 60 * 60 * 12, expire: 60 * 60 * 24 });
  return fetchRates();
}

export async function GET() {
  return Response.json(await getRates());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/money` — Expected: all PASS. If the `$US` / `F CFA` glyphs differ on this Node's ICU, fix the **assertion** to match the real `fr-FR` output (print it once), not the implementation.

- [ ] **Step 5: Commit**

```bash
git add lib/money app/api/rates
git commit -m "feat(money): EUR formatting, local-currency approximation, cached rates endpoint"
```

---

### Task 3: Database schema, RLS, triggers, and PGlite test harness

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/types.ts`, `lib/db/client.ts`, `drizzle.config.ts`, `drizzle/0000_*.sql` (generated), `drizzle/0001_rls_and_triggers.sql` (custom), `tests/db/harness.ts`, `tests/db/factories.ts`
- Test: `tests/db/schema.test.ts`

**Interfaces:**
- Produces:
  - Tables (Drizzle objects): `profiles`, `categories`, `courses`, `sections`, `lessons`, `enrollments`; enums `roleEnum`, `levelEnum`, `statusEnum`, `lessonKindEnum`, `enrollmentSourceEnum`.
  - `type Db` — any Drizzle Postgres database typed with our schema (PGlite or postgres-js).
  - `db: Db` from `lib/db/client.ts` (server-only).
  - `type Role = 'student' | 'instructor' | 'admin'`, `type Level = 'beginner'|'intermediate'|'advanced'|'all'` exported from schema as `(typeof roleEnum.enumValues)[number]` etc.
  - Test helpers: `createTestDb(): Promise<{ client: PGlite; db: Db }>`, `createUser(client, { email, displayName?, id? }): Promise<string>`, `asUser(client, userId | null, fn)`; factories `makeCategory(db, over?)`, `makeInstructor(client, db, over?)`, `makeCourse(db, { instructorId, categoryId, ...over })`, `makeSection(db, courseId, position, title?)`, `makeLesson(db, sectionId, position, over?)`.

- [ ] **Step 1: Write the schema**

`lib/db/schema.ts`:
```ts
import { sql } from 'drizzle-orm';
import {
  boolean, char, check, customType, index, integer, numeric, pgEnum, pgSchema, pgTable,
  text, timestamp, unique, uuid,
} from 'drizzle-orm/pg-core';

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

export const roleEnum = pgEnum('user_role', ['student', 'instructor', 'admin']);
export const levelEnum = pgEnum('course_level', ['beginner', 'intermediate', 'advanced', 'all']);
export const statusEnum = pgEnum('course_status', ['draft', 'in_review', 'published', 'rejected', 'archived']);
export const lessonKindEnum = pgEnum('lesson_kind', ['video', 'text', 'quiz']);
export const enrollmentSourceEnum = pgEnum('enrollment_source', ['purchase', 'free', 'admin']);

export type Role = (typeof roleEnum.enumValues)[number];
export type Level = (typeof levelEnum.enumValues)[number];
export type CourseStatus = (typeof statusEnum.enumValues)[number];

// Supabase-owned table; referenced for FKs only (drizzle-kit ignores the auth schema).
const auth = pgSchema('auth');
export const authUsers = auth.table('users', { id: uuid('id').primaryKey() });

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarPath: text('avatar_path'),
  headline: text('headline'),
  bio: text('bio'),
  role: roleEnum('role').notNull().default('student'),
  isHouse: boolean('is_house').notNull().default(false),
  country: char('country', { length: 2 }),
  ...timestamps,
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
});

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    instructorId: uuid('instructor_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull().default(''),
    description: text('description').notNull().default(''),
    outcomes: text('outcomes').array().notNull().default(sql`'{}'::text[]`),
    requirements: text('requirements').array().notNull().default(sql`'{}'::text[]`),
    level: levelEnum('level').notNull().default('all'),
    language: text('language').notNull().default('fr'),
    priceCents: integer('price_cents').notNull(),
    status: statusEnum('status').notNull().default('draft'),
    thumbnailPath: text('thumbnail_path'),
    promoPlaybackId: text('promo_playback_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ratingAvg: numeric('rating_avg', { precision: 2, scale: 1 }),
    ratingCount: integer('rating_count').notNull().default(0),
    enrollmentCount: integer('enrollment_count').notNull().default(0),
    totalDurationSeconds: integer('total_duration_seconds').notNull().default(0),
    lessonCount: integer('lesson_count').notNull().default(0),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('french', coalesce(title, '')), 'A') || setweight(to_tsvector('french', coalesce(subtitle, '')), 'B') || setweight(to_tsvector('french', coalesce(description, '')), 'C')`,
    ),
    ...timestamps,
  },
  (t) => [
    check('courses_price_nonneg', sql`${t.priceCents} >= 0`),
    index('courses_search_idx').using('gin', t.search),
    index('courses_status_idx').on(t.status),
    index('courses_instructor_idx').on(t.instructorId),
  ],
);

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
  },
  (t) => [unique('sections_course_position').on(t.courseId, t.position)],
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    kind: lessonKindEnum('kind').notNull().default('video'),
    isPreview: boolean('is_preview').notNull().default(false),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    muxPlaybackId: text('mux_playback_id'),
    body: text('body'),
  },
  (t) => [unique('lessons_section_position').on(t.sectionId, t.position)],
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'restrict' }),
    source: enrollmentSourceEnum('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('enrollments_user_course').on(t.userId, t.courseId), index('enrollments_course_idx').on(t.courseId)],
);
```

`lib/db/types.ts`:
```ts
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from './schema';

/** Any Drizzle Postgres database bound to our schema (postgres-js in prod, PGlite in tests). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
```

`lib/db/client.ts`:
```ts
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Db } from './types';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
// prepare:false is required by Supabase's transaction pooler.
const client = globalForDb.pgClient ?? postgres(url, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client;

export const db: Db = drizzle(client, { schema });
```

`drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile('.env.local');
} catch {
  // CI or generate-only runs may have no env file
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: { url: process.env.DIRECT_DATABASE_URL ?? '' },
});
```

- [ ] **Step 2: Generate migrations**

Run: `npm run db:generate` → creates `drizzle/0000_<name>.sql`. Inspect it: it must contain `CREATE TABLE "profiles"` with `REFERENCES "auth"."users"("id")` and must NOT contain `CREATE TABLE "auth"."users"` (if it does, delete that statement and re-check `schemaFilter`).

Run: `npx drizzle-kit generate --custom --name=rls_and_triggers` → creates an empty `drizzle/0001_rls_and_triggers.sql`. Fill it:

```sql
-- Helper: is the current JWT user an admin? (security definer: bypasses RLS on profiles)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
--> statement-breakpoint

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1), 'Apprenant')
  )
  on conflict (id) do nothing;
  return new;
end $$;
--> statement-breakpoint
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
--> statement-breakpoint

-- role / is_house are admin-managed: browser roles cannot change them.
create or replace function public.protect_profile_privileges() returns trigger
language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.is_house is distinct from old.is_house)
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'role and is_house are admin-managed' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
--> statement-breakpoint
create trigger profiles_protect_privileges before update on public.profiles
  for each row execute function public.protect_profile_privileges();
--> statement-breakpoint

alter table public.profiles enable row level security;
--> statement-breakpoint
alter table public.categories enable row level security;
--> statement-breakpoint
alter table public.courses enable row level security;
--> statement-breakpoint
alter table public.sections enable row level security;
--> statement-breakpoint
alter table public.lessons enable row level security;
--> statement-breakpoint
alter table public.enrollments enable row level security;
--> statement-breakpoint

-- Public, non-sensitive profile fields.
create view public.public_profiles as
  select id, display_name, avatar_path, headline, bio, role, is_house from public.profiles;
--> statement-breakpoint
grant select on public.public_profiles to anon, authenticated;
--> statement-breakpoint

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
--> statement-breakpoint
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
--> statement-breakpoint

create policy categories_read on public.categories for select to anon, authenticated using (true);
--> statement-breakpoint
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
--> statement-breakpoint

-- Phase 1: the browser never writes courses/curriculum; the server writes through the DB owner role.
create policy courses_read on public.courses for select to anon, authenticated
  using (status = 'published' or instructor_id = auth.uid() or public.is_admin());
--> statement-breakpoint
create policy courses_admin on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
--> statement-breakpoint
create policy sections_read on public.sections for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id
    and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())));
--> statement-breakpoint
create policy lessons_read on public.lessons for select to anon, authenticated
  using (exists (select 1 from public.sections s join public.courses c on c.id = s.course_id
    where s.id = section_id and (c.status = 'published' or c.instructor_id = auth.uid() or public.is_admin())));
--> statement-breakpoint

-- No insert/update/delete policy: enrollments are only created server-side.
create policy enrollments_read on public.enrollments for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid())
    or public.is_admin());
```

- [ ] **Step 3: Write the PGlite harness and factories**

`tests/db/harness.ts`:
```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';

// Minimal stand-ins for what Supabase provides, so real migrations apply unchanged.
const SUPABASE_STUBS = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
`;

const SUPABASE_GRANTS = `
  grant usage on schema public, auth to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant execute on all functions in schema public, auth to anon, authenticated;
`;

export async function createTestDb(): Promise<{ client: PGlite; db: Db }> {
  const client = new PGlite();
  await client.exec(SUPABASE_STUBS);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: 'drizzle' });
  await client.exec(SUPABASE_GRANTS);
  return { client, db: db as unknown as Db };
}

export async function createUser(
  client: PGlite,
  opts: { email: string; displayName?: string; id?: string },
): Promise<string> {
  const id = opts.id ?? crypto.randomUUID();
  await client.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [
    id,
    opts.email,
    JSON.stringify(opts.displayName ? { display_name: opts.displayName } : {}),
  ]);
  return id;
}

/** Run fn as a Supabase browser role (RLS applies). null = anonymous. */
export async function asUser<T>(client: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await client.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  await client.exec(`set role ${userId ? 'authenticated' : 'anon'}`);
  try {
    return await fn();
  } finally {
    await client.exec('reset role');
    await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
```

`tests/db/factories.ts`:
```ts
import type { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { categories, courses, lessons, profiles, sections } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { createUser } from './harness';

let seq = 0;
const next = () => ++seq;

export async function makeCategory(db: Db, over: Partial<typeof categories.$inferInsert> = {}) {
  const n = next();
  const [row] = await db.insert(categories).values({ slug: `cat-${n}`, name: `Catégorie ${n}`, position: n, ...over }).returning();
  return row;
}

export async function makeInstructor(
  client: PGlite,
  db: Db,
  over: { displayName?: string; role?: 'instructor' | 'admin'; isHouse?: boolean } = {},
) {
  const n = next();
  const id = await createUser(client, { email: `instructor${n}@test.dev`, displayName: over.displayName ?? `Formateur ${n}` });
  await db.update(profiles).set({ role: over.role ?? 'instructor', isHouse: over.isHouse ?? false }).where(eq(profiles.id, id));
  return id;
}

export async function makeCourse(
  db: Db,
  input: { instructorId: string; categoryId: string } & Partial<typeof courses.$inferInsert>,
) {
  const n = next();
  const [row] = await db
    .insert(courses)
    .values({
      slug: `cours-${n}`,
      title: `Cours ${n}`,
      priceCents: 4900,
      status: 'published',
      publishedAt: new Date(Date.UTC(2026, 0, n)),
      ...input,
    })
    .returning();
  return row;
}

export async function makeSection(db: Db, courseId: string, position: number, title = `Section ${position}`) {
  const [row] = await db.insert(sections).values({ courseId, position, title }).returning();
  return row;
}

export async function makeLesson(
  db: Db,
  sectionId: string,
  position: number,
  over: Partial<typeof lessons.$inferInsert> = {},
) {
  const [row] = await db
    .insert(lessons)
    .values({ sectionId, position, title: `Leçon ${position}`, durationSeconds: 300, ...over })
    .returning();
  return row;
}
```

- [ ] **Step 4: Write the failing schema/RLS tests**

`tests/db/schema.test.ts`:
```ts
import type { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { courses, enrollments, profiles } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { asUser, createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;

beforeAll(async () => {
  ({ client, db } = await createTestDb());
});

describe('profile trigger', () => {
  it('creates a student profile using display_name metadata', async () => {
    const id = await createUser(client, { email: 'awa@test.dev', displayName: 'Awa Diallo' });
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p).toMatchObject({ displayName: 'Awa Diallo', role: 'student', isHouse: false });
  });

  it('falls back to the email local part', async () => {
    const id = await createUser(client, { email: 'kofi.mensah@test.dev' });
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p.displayName).toBe('kofi.mensah');
  });
});

describe('privilege protection', () => {
  it('lets a user edit their bio but not their role', async () => {
    const id = await createUser(client, { email: 'sneaky@test.dev' });
    await asUser(client, id, () => client.query(`update public.profiles set bio = 'Bonjour' where id = $1`, [id]));
    await expect(
      asUser(client, id, () => client.query(`update public.profiles set role = 'admin' where id = $1`, [id])),
    ).rejects.toThrow(/admin-managed/);
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p).toMatchObject({ bio: 'Bonjour', role: 'student' });
  });
});

describe('course visibility (RLS)', () => {
  it('shows anonymous visitors only published courses', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const pub = await makeCourse(db, { instructorId, categoryId: cat.id, status: 'published' });
    const draft = await makeCourse(db, { instructorId, categoryId: cat.id, status: 'draft' });
    const rows = await asUser(client, null, () =>
      client.query<{ id: string }>('select id from public.courses where id = any($1)', [[pub.id, draft.id]]),
    );
    expect(rows.rows.map((r) => r.id)).toEqual([pub.id]);
  });

  it('populates the full-text search vector', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId, categoryId: cat.id, title: 'Exportation du cacao' });
    const [row] = await db
      .select({ hit: sql<boolean>`${courses.search} @@ websearch_to_tsquery('french', 'exporter cacao')` })
      .from(courses)
      .where(eq(courses.id, c.id));
    expect(row.hit).toBe(true);
  });
});

describe('enrollments (RLS)', () => {
  it('cannot be inserted from the browser', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0 });
    const student = await createUser(client, { email: 'free-rider@test.dev' });
    await expect(
      asUser(client, student, () =>
        client.query(`insert into public.enrollments (user_id, course_id, source) values ($1, $2, 'free')`, [student, c.id]),
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, student))).toHaveLength(0);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/db/schema.test.ts` — Expected: PASS.
If PGlite rejects `create role`/`set role`, check the installed PGlite version's docs (`node_modules/@electric-sql/pglite/README.md`); do not weaken the policies to make tests pass. If PGlite lacks the `french` text-search config, report it — do not switch production to `simple`.

- [ ] **Step 6: Commit**

```bash
git add lib/db drizzle drizzle.config.ts tests/db
git commit -m "feat(db): schema, RLS policies, profile triggers, PGlite test harness"
```

---

### Task 4: Seed data and SQL apply script

Seeds categories, the Proactive house instructor, and the 8 existing courses with curricula. Ratings and enrollments start at **0** — the site must not display invented social proof.

**Files:**
- Create: `lib/db/seed-data.ts`, `lib/db/seed.ts`, `scripts/seed.ts`, `scripts/apply-sql.ts`, `supabase/storage.sql`
- Test: `tests/db/seed.test.ts`

**Interfaces:**
- Consumes: `Db`, schema tables (Task 3).
- Produces: `seedCatalog(db: Db, houseInstructorId: string): Promise<{ categories: number; courses: number }>` (idempotent); `SEED_CATEGORIES`, `SEED_COURSES`.

- [ ] **Step 1: Write the seed data**

`lib/db/seed-data.ts`:
```ts
import type { Level } from './schema';

export const SEED_CATEGORIES = [
  { slug: 'negoce', name: 'Négoce' },
  { slug: 'import-export', name: 'Import-Export' },
  { slug: 'logistique', name: 'Logistique' },
  { slug: 'finance', name: 'Finance' },
  { slug: 'douane', name: 'Douane' },
  { slug: 'juridique', name: 'Juridique' },
  { slug: 'agriculture', name: 'Agriculture' },
  { slug: 'qualite', name: 'Qualité' },
  { slug: 'strategie', name: 'Stratégie' },
  { slug: 'sourcing', name: 'Sourcing' },
] as const;

type SeedCourse = {
  slug: string;
  category: (typeof SEED_CATEGORIES)[number]['slug'];
  title: string;
  subtitle: string;
  description: string;
  outcomes: string[];
  requirements: string[];
  level: Level;
  priceCents: number;
  thumbnailPath: string;
  sections: { title: string; lessons: { title: string; minutes: number; preview?: boolean }[] }[];
};

export const SEED_COURSES: SeedCourse[] = [
  {
    slug: 'fondements-negoce-international',
    category: 'negoce',
    title: 'Les Fondements du Négoce International',
    subtitle: 'Acheter, vendre et sécuriser une transaction de matières premières de A à Z.',
    description:
      "Cette formation pose les bases du métier de négociant : comprendre la chaîne de valeur des matières premières africaines, structurer une offre, négocier avec un acheteur étranger et sécuriser chaque étape jusqu'au paiement.\n\nElle s'appuie sur des cas réels traités par Proactive Services sur le karité, le sésame et la noix de cajou.",
    outcomes: [
      'Comprendre le rôle et la rémunération du négociant',
      'Structurer une offre commerciale crédible',
      'Identifier les risques d’une transaction et les couvrir',
      'Lire et négocier un contrat de vente international',
    ],
    requirements: ['Aucun prérequis : la formation part des bases'],
    level: 'beginner',
    priceCents: 99000,
    thumbnailPath: '/photo_2026-09-29_14-16-58.jpg',
    sections: [
      { title: 'Le métier de négociant', lessons: [
        { title: 'Bienvenue et objectifs de la formation', minutes: 4, preview: true },
        { title: 'La chaîne de valeur des matières premières africaines', minutes: 14 },
        { title: 'Comment le négociant gagne sa marge', minutes: 11 },
      ] },
      { title: 'Construire et négocier une offre', lessons: [
        { title: 'Fiche produit, spécifications et échantillons', minutes: 12 },
        { title: 'Fixer son prix : coûts, marge et Incoterms', minutes: 16 },
        { title: 'Négocier avec un acheteur étranger', minutes: 13 },
      ] },
      { title: 'Sécuriser la transaction', lessons: [
        { title: 'Les risques d’une opération de négoce', minutes: 10 },
        { title: 'Moyens de paiement et garanties', minutes: 15 },
        { title: 'Étude de cas : une cargaison de karité', minutes: 18 },
      ] },
    ],
  },
  {
    slug: 'supply-chain-africaine',
    category: 'logistique',
    title: 'Maîtriser la Supply Chain Africaine',
    subtitle: 'Du producteur au port d’embarquement : organiser une logistique fiable.',
    description:
      "Collecte, stockage, transport intérieur, empotage et fret maritime : cette formation détaille chaque maillon de la chaîne logistique export en Afrique de l'Ouest et du Centre, avec les pièges à éviter et les bons interlocuteurs.",
    outcomes: [
      'Cartographier une chaîne logistique export',
      'Choisir transporteurs, transitaires et entrepôts',
      'Anticiper délais et coûts portuaires',
    ],
    requirements: ['Connaître les bases du commerce international est un plus'],
    level: 'intermediate',
    priceCents: 75000,
    thumbnailPath: '/photo_2026-09-29_14-16-59.jpg',
    sections: [
      { title: 'Vue d’ensemble', lessons: [
        { title: 'Les maillons de la chaîne', minutes: 6, preview: true },
        { title: 'Acteurs et responsabilités', minutes: 12 },
      ] },
      { title: 'Du champ au port', lessons: [
        { title: 'Collecte et stockage', minutes: 14 },
        { title: 'Transport intérieur', minutes: 11 },
        { title: 'Empotage et contrôle', minutes: 13 },
      ] },
      { title: 'Le fret maritime', lessons: [
        { title: 'Réserver un conteneur', minutes: 9 },
        { title: 'Coûts portuaires et surestaries', minutes: 15 },
      ] },
    ],
  },
  {
    slug: 'normes-certifications-export',
    category: 'qualite',
    title: 'Normes et Certifications à l’Export',
    subtitle: 'Bio, phytosanitaire, traçabilité : passer les contrôles européens.',
    description:
      "L'accès au marché européen dépend du respect de normes précises. Cette formation explique les certifications attendues (bio, phytosanitaire, origine), comment les obtenir et comment documenter la traçabilité d'un lot.",
    outcomes: [
      'Connaître les normes exigées par l’Union européenne',
      'Préparer un dossier de certification',
      'Organiser la traçabilité d’un lot',
    ],
    requirements: ['Aucun'],
    level: 'all',
    priceCents: 50000,
    thumbnailPath: '/photo_2026-09-29_14-17-00.jpg',
    sections: [
      { title: 'Le cadre réglementaire', lessons: [
        { title: 'Pourquoi les normes conditionnent l’accès au marché', minutes: 5, preview: true },
        { title: 'Réglementation européenne : l’essentiel', minutes: 15 },
      ] },
      { title: 'Certifications', lessons: [
        { title: 'Certification biologique', minutes: 14 },
        { title: 'Certificats phytosanitaires et d’origine', minutes: 12 },
        { title: 'Traçabilité d’un lot', minutes: 11 },
      ] },
    ],
  },
  {
    slug: 'securisation-paiements-credoc',
    category: 'finance',
    title: 'Sécurisation des Paiements (Credoc)',
    subtitle: 'Crédit documentaire, garanties et encaissement sans mauvaise surprise.',
    description:
      "Le crédit documentaire reste l'outil de référence pour sécuriser un paiement international. Cette formation explique son fonctionnement, les documents exigés et les erreurs qui font rejeter une présentation.",
    outcomes: [
      'Comprendre le fonctionnement d’un crédit documentaire',
      'Préparer une présentation de documents conforme',
      'Comparer Credoc, remise documentaire et garanties',
    ],
    requirements: ['Notions de base en commerce international'],
    level: 'advanced',
    priceCents: 120000,
    thumbnailPath: '/photo_2026-09-29_14-17-01.jpg',
    sections: [
      { title: 'Les moyens de paiement internationaux', lessons: [
        { title: 'Panorama et niveaux de risque', minutes: 7, preview: true },
        { title: 'Remise documentaire', minutes: 12 },
      ] },
      { title: 'Le crédit documentaire', lessons: [
        { title: 'Acteurs et déroulement', minutes: 16 },
        { title: 'Les documents exigés', minutes: 14 },
        { title: 'Réserves et rejets : les éviter', minutes: 13 },
      ] },
      { title: 'Garanties', lessons: [
        { title: 'Garanties bancaires et stand-by', minutes: 12 },
      ] },
    ],
  },
  {
    slug: 'penetrer-marche-europeen',
    category: 'strategie',
    title: 'Pénétrer le Marché Européen',
    subtitle: 'Trouver ses premiers acheteurs européens et construire une relation durable.',
    description:
      'Identifier les bons segments, approcher importateurs et distributeurs, participer aux salons et construire une relation commerciale durable avec des acheteurs européens.',
    outcomes: [
      'Choisir un segment et un pays cible',
      'Approcher des importateurs qualifiés',
      'Préparer un salon professionnel',
    ],
    requirements: ['Avoir un produit ou une filière cible'],
    level: 'intermediate',
    priceCents: 150000,
    thumbnailPath: '/negoce 1.jpeg',
    sections: [
      { title: 'Stratégie', lessons: [
        { title: 'Lire le marché européen', minutes: 8, preview: true },
        { title: 'Choisir son segment', minutes: 13 },
      ] },
      { title: 'Prospection', lessons: [
        { title: 'Trouver et qualifier des importateurs', minutes: 15 },
        { title: 'Réussir un salon professionnel', minutes: 12 },
        { title: 'Fidéliser un acheteur', minutes: 10 },
      ] },
    ],
  },
  {
    slug: 'identifier-fournisseurs-fiables',
    category: 'sourcing',
    title: 'Identifier les Fournisseurs Fiables',
    subtitle: 'Sélectionner, auditer et contractualiser avec des producteurs africains.',
    description:
      'Comment trouver des coopératives et producteurs sérieux, vérifier leurs capacités et leur qualité, et construire un partenariat équitable et durable.',
    outcomes: [
      'Construire une grille de sélection fournisseurs',
      'Mener un audit terrain',
      'Contractualiser un partenariat équitable',
    ],
    requirements: ['Aucun'],
    level: 'beginner',
    priceCents: 85000,
    thumbnailPath: '/negoce 2.jpeg',
    sections: [
      { title: 'Trouver des fournisseurs', lessons: [
        { title: 'Où chercher', minutes: 6, preview: true },
        { title: 'Grille de sélection', minutes: 12 },
      ] },
      { title: 'Vérifier et contractualiser', lessons: [
        { title: 'L’audit terrain', minutes: 15 },
        { title: 'Contrats d’approvisionnement', minutes: 13 },
      ] },
    ],
  },
  {
    slug: 'optimisation-douaniere-incoterms',
    category: 'douane',
    title: 'Optimisation Douanière et Incoterms',
    subtitle: 'Choisir le bon Incoterm et réduire légalement ses coûts douaniers.',
    description:
      'Les Incoterms 2020 expliqués par la pratique, les régimes douaniers utiles à l’export et les leviers légaux pour réduire les coûts de dédouanement.',
    outcomes: [
      'Choisir l’Incoterm adapté à chaque opération',
      'Comprendre la valeur en douane',
      'Utiliser les accords préférentiels',
    ],
    requirements: ['Aucun'],
    level: 'all',
    priceCents: 60000,
    thumbnailPath: '/negoce3.jpeg',
    sections: [
      { title: 'Les Incoterms', lessons: [
        { title: 'À quoi servent les Incoterms', minutes: 5, preview: true },
        { title: 'Les 11 Incoterms 2020', minutes: 18 },
      ] },
      { title: 'La douane', lessons: [
        { title: 'Valeur en douane et classement tarifaire', minutes: 14 },
        { title: 'Accords préférentiels et origine', minutes: 12 },
      ] },
    ],
  },
  {
    slug: 'redaction-contrats-vente',
    category: 'juridique',
    title: 'Rédaction de Contrats de Vente',
    subtitle: 'Les clauses qui protègent le vendeur dans une vente internationale.',
    description:
      'Structure d’un contrat de vente internationale, clauses essentielles (qualité, livraison, paiement, force majeure, litiges) et modèles commentés.',
    outcomes: [
      'Structurer un contrat de vente international',
      'Rédiger les clauses essentielles',
      'Choisir loi applicable et mode de règlement des litiges',
    ],
    requirements: ['Notions de base en négoce'],
    level: 'advanced',
    priceCents: 90000,
    thumbnailPath: '/negoce4.jpeg',
    sections: [
      { title: 'Structure du contrat', lessons: [
        { title: 'Pourquoi un contrat écrit', minutes: 5, preview: true },
        { title: 'Les parties du contrat', minutes: 12 },
      ] },
      { title: 'Clauses essentielles', lessons: [
        { title: 'Qualité, quantité, livraison', minutes: 14 },
        { title: 'Paiement et pénalités', minutes: 12 },
        { title: 'Force majeure et litiges', minutes: 13 },
      ] },
    ],
  },
];
```

- [ ] **Step 2: Write the failing seed test**

`tests/db/seed.test.ts`:
```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { seedCatalog } from '@/lib/db/seed';
import { SEED_COURSES } from '@/lib/db/seed-data';
import { categories, courses, lessons, sections } from '@/lib/db/schema';
import { createTestDb, createUser } from './harness';

describe('seedCatalog', () => {
  it('seeds published courses with computed totals and is idempotent', async () => {
    const { client, db } = await createTestDb();
    const house = await createUser(client, { email: 'academie@test.dev', displayName: 'Proactive Académie' });

    expect(await seedCatalog(db, house)).toEqual({ categories: 10, courses: SEED_COURSES.length });
    await seedCatalog(db, house); // second run must not duplicate

    expect(await db.select().from(categories)).toHaveLength(10);
    const all = await db.select().from(courses);
    expect(all).toHaveLength(SEED_COURSES.length);
    expect(all.every((c) => c.status === 'published' && c.ratingCount === 0 && c.enrollmentCount === 0)).toBe(true);

    const first = all.find((c) => c.slug === SEED_COURSES[0].slug)!;
    const expectedSeconds = SEED_COURSES[0].sections.flatMap((s) => s.lessons).reduce((t, l) => t + l.minutes * 60, 0);
    expect(first.totalDurationSeconds).toBe(expectedSeconds);
    expect(first.lessonCount).toBe(9);
    const secs = await db.select().from(sections).where(eq(sections.courseId, first.id));
    expect(secs).toHaveLength(3);
    expect(await db.select().from(lessons)).toHaveLength(
      SEED_COURSES.flatMap((c) => c.sections.flatMap((s) => s.lessons)).length,
    );
  });
});
```
Run: `npx vitest run tests/db/seed.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `seedCatalog`**

`lib/db/seed.ts`:
```ts
import { eq, sql } from 'drizzle-orm';
import { categories, courses, lessons, profiles, sections } from './schema';
import { SEED_CATEGORIES, SEED_COURSES } from './seed-data';
import type { Db } from './types';

export async function seedCatalog(db: Db, houseInstructorId: string) {
  await db
    .update(profiles)
    .set({ role: 'instructor', isHouse: true, displayName: 'Proactive Académie', headline: 'Négoce et commerce international des matières premières africaines' })
    .where(eq(profiles.id, houseInstructorId));

  for (const [i, c] of SEED_CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ slug: c.slug, name: c.name, position: i })
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name, position: i } });
  }
  const cats = new Map((await db.select().from(categories)).map((c) => [c.slug, c.id]));

  for (const course of SEED_COURSES) {
    await db.transaction(async (tx) => {
      const allLessons = course.sections.flatMap((s) => s.lessons);
      const [row] = await tx
        .insert(courses)
        .values({
          slug: course.slug,
          instructorId: houseInstructorId,
          categoryId: cats.get(course.category)!,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          outcomes: course.outcomes,
          requirements: course.requirements,
          level: course.level,
          priceCents: course.priceCents,
          thumbnailPath: course.thumbnailPath,
          status: 'published',
          publishedAt: sql`now()`,
          lessonCount: allLessons.length,
          totalDurationSeconds: allLessons.reduce((t, l) => t + l.minutes * 60, 0),
        })
        .onConflictDoNothing({ target: courses.slug })
        .returning({ id: courses.id });
      if (!row) return; // already seeded

      for (const [si, s] of course.sections.entries()) {
        const [sec] = await tx.insert(sections).values({ courseId: row.id, position: si, title: s.title }).returning();
        await tx.insert(lessons).values(
          s.lessons.map((l, li) => ({
            sectionId: sec.id,
            position: li,
            title: l.title,
            kind: 'video' as const,
            isPreview: l.preview ?? false,
            durationSeconds: l.minutes * 60,
          })),
        );
      }
    });
  }

  return { categories: SEED_CATEGORIES.length, courses: SEED_COURSES.length };
}
```

Run: `npx vitest run tests/db/seed.test.ts` — Expected: PASS.

- [ ] **Step 4: CLI scripts and storage SQL**

`scripts/seed.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema';
import { seedCatalog } from '../lib/db/seed';
import type { Db } from '../lib/db/types';

const HOUSE_EMAIL = process.env.SEED_HOUSE_EMAIL ?? 'academie@proactive-services.com';

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });

  // Find or create the house account (no password: owner sets it via "mot de passe oublié").
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  let houseId = list.users.find((u) => u.email === HOUSE_EMAIL)?.id;
  if (!houseId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: HOUSE_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: 'Proactive Académie' },
    });
    if (error) throw error;
    houseId = data.user.id;
  }

  const sqlClient = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
  try {
    const result = await seedCatalog(drizzle(sqlClient, { schema }) as unknown as Db, houseId);
    console.log('Seeded', result, 'house instructor', HOUSE_EMAIL);
  } finally {
    await sqlClient.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

`scripts/apply-sql.ts`:
```ts
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const file = process.argv[2];
if (!file) throw new Error('usage: tsx scripts/apply-sql.ts <file.sql>');
const sql = postgres(process.env.DIRECT_DATABASE_URL!, { max: 1 });
sql
  .unsafe(readFileSync(file, 'utf8'))
  .then(() => console.log('Applied', file))
  .finally(() => sql.end());
```

`supabase/storage.sql` (hosted Supabase only — PGlite has no storage schema):
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('course-media', 'course-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Users manage files only inside a folder named after their user id: avatars/<uid>/...
drop policy if exists "avatar owner insert" on storage.objects;
create policy "avatar owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar owner update" on storage.objects;
create policy "avatar owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 5: Apply to the hosted project (requires owner prerequisites)**

```bash
npm run db:migrate
npm run db:storage
npm run db:seed
```
Expected: `Seeded { categories: 10, courses: 8 } house instructor academie@proactive-services.com`. If `.env.local` is missing, skip this step, note it in the task report, and continue — the PGlite test is the gate.

- [ ] **Step 6: Commit**

```bash
git add lib/db/seed-data.ts lib/db/seed.ts scripts supabase tests/db/seed.test.ts
git commit -m "feat(db): idempotent catalog seed and storage bucket setup"
```

---

### Task 5: Catalog query layer

URL-param parsing, href building, and all public read queries.

**Files:**
- Create: `lib/catalog/params.ts`, `lib/catalog/href.ts`, `lib/db/queries/catalog.ts`, `lib/catalog/cached.ts`
- Test: `lib/catalog/params.test.ts`, `lib/catalog/href.test.ts`, `tests/db/catalog.test.ts`

**Interfaces:**
- Consumes: `Db`, schema (Task 3); factories/harness.
- Produces:
  - `SORTS`, `type Sort = 'popular'|'rating'|'newest'|'price_asc'|'price_desc'`, `PAGE_SIZE = 24`
  - `type CatalogQuery = { q?: string; category?: string; level?: Level; price?: 'free' | 'paid'; sort: Sort; page: number }`
  - `parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogQuery`
  - `catalogHref(query: CatalogQuery, patch?: Partial<CatalogQuery>): string` (patching any filter resets `page` to 1 unless `page` is in the patch; omits defaults)
  - `type CourseCardData = { id: string; slug: string; title: string; subtitle: string; thumbnailPath: string | null; priceCents: number; level: Level; ratingAvg: number | null; ratingCount: number; enrollmentCount: number; totalDurationSeconds: number; lessonCount: number; instructorId: string; instructorName: string; categorySlug: string; categoryName: string }`
  - `searchCourses(db, q: CatalogQuery): Promise<{ items: CourseCardData[]; total: number }>`
  - `listCategories(db): Promise<{ id: string; slug: string; name: string }[]>`
  - `type CourseDetail = CourseCardData & { description: string; outcomes: string[]; requirements: string[]; language: string; promoPlaybackId: string | null; updatedAt: Date; instructor: { id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null }; sections: { id: string; title: string; lessons: { id: string; title: string; kind: 'video'|'text'|'quiz'; isPreview: boolean; durationSeconds: number }[] }[] }`
  - `getCourseBySlug(db, slug: string): Promise<CourseDetail | null>` (published only)
  - `type InstructorPage = { id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null; stats: { courses: number; students: number; ratingAvg: number | null }; courses: CourseCardData[] }`
  - `getInstructorPage(db, id: string): Promise<InstructorPage | null>` (null unless role instructor/admin with ≥1 published course)
  - `getPlatformStats(db): Promise<{ courses: number; instructors: number; students: number }>`
  - Cached wrappers in `lib/catalog/cached.ts`: `cachedSearchCourses(q)`, `cachedCategories()`, `cachedCourse(slug)`, `cachedInstructor(id)`, `cachedPlatformStats()`, `cachedPopularCourses(limit = 8)` — all tagged `'courses'`.

- [ ] **Step 1: Failing tests for params and href**

`lib/catalog/params.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseCatalogParams } from './params';

describe('parseCatalogParams', () => {
  it('returns defaults for empty input', () => {
    expect(parseCatalogParams({})).toEqual({ sort: 'popular', page: 1 });
  });

  it('parses valid values', () => {
    expect(
      parseCatalogParams({ q: '  cacao ', category: 'negoce', level: 'advanced', price: 'free', sort: 'price_asc', page: '3' }),
    ).toEqual({ q: 'cacao', category: 'negoce', level: 'advanced', price: 'free', sort: 'price_asc', page: 3 });
  });

  it('falls back to defaults for garbage instead of throwing', () => {
    expect(
      parseCatalogParams({ page: '-3', sort: 'drop table', level: 'expert', price: 'cheap', category: '../etc', q: '   ' }),
    ).toEqual({ sort: 'popular', page: 1 });
    expect(parseCatalogParams({ page: 'abc' }).page).toBe(1);
    expect(parseCatalogParams({ page: '99999' }).page).toBe(1);
    expect(parseCatalogParams({ page: '2.5' }).page).toBe(1);
  });

  it('takes the first value of repeated params', () => {
    expect(parseCatalogParams({ sort: ['rating', 'newest'], q: ['a', 'b'] })).toMatchObject({ sort: 'rating', q: 'a' });
  });

  it('truncates very long queries to 100 chars', () => {
    expect(parseCatalogParams({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
});
```

`lib/catalog/href.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { catalogHref } from './href';

describe('catalogHref', () => {
  it('omits defaults', () => {
    expect(catalogHref({ sort: 'popular', page: 1 })).toBe('/courses');
  });

  it('resets page when a filter changes', () => {
    expect(catalogHref({ sort: 'popular', page: 4, q: 'cacao' }, { category: 'negoce' })).toBe('/courses?q=cacao&category=negoce');
  });

  it('keeps page when paging', () => {
    expect(catalogHref({ sort: 'rating', page: 1 }, { page: 2 })).toBe('/courses?sort=rating&page=2');
  });

  it('removes a filter when patched to undefined', () => {
    expect(catalogHref({ sort: 'popular', page: 1, level: 'beginner' }, { level: undefined })).toBe('/courses');
  });

  it('encodes user input', () => {
    expect(catalogHref({ sort: 'popular', page: 1, q: "l'export & co" })).toBe("/courses?q=l%27export+%26+co");
  });
});
```
Run: `npx vitest run lib/catalog` — Expected: FAIL.

- [ ] **Step 2: Implement params and href**

`lib/catalog/params.ts`:
```ts
import { z } from 'zod';
import type { Level } from '@/lib/db/schema';

export const SORTS = ['popular', 'rating', 'newest', 'price_asc', 'price_desc'] as const;
export type Sort = (typeof SORTS)[number];
export const LEVELS = ['beginner', 'intermediate', 'advanced', 'all'] as const satisfies readonly Level[];
export const PAGE_SIZE = 24;
const MAX_PAGE = 1000;

export type CatalogQuery = {
  q?: string;
  category?: string;
  level?: Level;
  price?: 'free' | 'paid';
  sort: Sort;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const qSchema = z.string().trim().min(1).transform((s) => s.slice(0, 100));
const slugSchema = z.string().regex(/^[a-z0-9-]{1,60}$/);
const pageSchema = z.coerce.number().int().min(1).max(MAX_PAGE);

export function parseCatalogParams(sp: RawParams): CatalogQuery {
  const out: CatalogQuery = { sort: 'popular', page: 1 };
  const q = qSchema.safeParse(first(sp.q));
  if (q.success) out.q = q.data;
  const category = slugSchema.safeParse(first(sp.category));
  if (category.success) out.category = category.data;
  const level = z.enum(LEVELS).safeParse(first(sp.level));
  if (level.success) out.level = level.data;
  const price = z.enum(['free', 'paid']).safeParse(first(sp.price));
  if (price.success) out.price = price.data;
  const sort = z.enum(SORTS).safeParse(first(sp.sort));
  if (sort.success) out.sort = sort.data;
  const page = pageSchema.safeParse(first(sp.page));
  if (page.success) out.page = page.data;
  return out;
}
```

`lib/catalog/href.ts`:
```ts
import type { CatalogQuery } from './params';

export function catalogHref(query: CatalogQuery, patch: Partial<CatalogQuery> = {}): string {
  const merged: CatalogQuery = { ...query, ...patch };
  if (!('page' in patch)) merged.page = 1;
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.category) params.set('category', merged.category);
  if (merged.level) params.set('level', merged.level);
  if (merged.price) params.set('price', merged.price);
  if (merged.sort !== 'popular') params.set('sort', merged.sort);
  if (merged.page > 1) params.set('page', String(merged.page));
  const qs = params.toString();
  return qs ? `/courses?${qs}` : '/courses';
}
```
Run: `npx vitest run lib/catalog` — Expected: PASS.

- [ ] **Step 3: Failing DB query tests**

`tests/db/catalog.test.ts`:
```ts
import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';
import { getCourseBySlug, getInstructorPage, getPlatformStats, listCategories, searchCourses } from '@/lib/db/queries/catalog';
import { courses, enrollments } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor, makeLesson, makeSection } from './factories';
import { createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;
let negoce: { id: string; slug: string };
let finance: { id: string; slug: string };
let instructorId: string;
const q = (over: Partial<CatalogQuery> = {}): CatalogQuery => ({ sort: 'popular', page: 1, ...over });

beforeAll(async () => {
  ({ client, db } = await createTestDb());
  negoce = await makeCategory(db, { slug: 'negoce', name: 'Négoce' });
  finance = await makeCategory(db, { slug: 'finance', name: 'Finance' });
  instructorId = await makeInstructor(client, db, { displayName: 'Josette Kameni' });
  await makeCourse(db, { instructorId, categoryId: negoce.id, slug: 'cacao', title: 'Exporter le cacao', priceCents: 9900, enrollmentCount: 50, ratingAvg: '4.2', ratingCount: 10, level: 'beginner' });
  await makeCourse(db, { instructorId, categoryId: negoce.id, slug: 'karite', title: 'Le beurre de karité', priceCents: 0, enrollmentCount: 5, level: 'all' });
  await makeCourse(db, { instructorId, categoryId: finance.id, slug: 'credoc', title: 'Sécuriser par crédit documentaire', priceCents: 120000, enrollmentCount: 20, ratingAvg: '4.9', ratingCount: 3, level: 'advanced' });
  await makeCourse(db, { instructorId, categoryId: finance.id, slug: 'brouillon', title: 'Brouillon cacao', status: 'draft' });
});

const slugs = (r: { items: { slug: string }[] }) => r.items.map((i) => i.slug);

describe('searchCourses', () => {
  it('lists only published courses, popular first', async () => {
    const r = await searchCourses(db, q());
    expect(slugs(r)).toEqual(['cacao', 'credoc', 'karite']);
    expect(r.total).toBe(3);
    expect(r.items[0]).toMatchObject({ instructorName: 'Josette Kameni', categoryName: 'Négoce', ratingAvg: 4.2 });
  });

  it('full-text searches in French (stemming)', async () => {
    expect(slugs(await searchCourses(db, q({ q: 'exportation cacao' })))).toEqual(['cacao']);
  });

  it.each(['"', '&|!', "l'export", 'le la les', ')(*', 'x'.repeat(100)])('survives hostile query %j', async (text) => {
    await expect(searchCourses(db, q({ q: text }))).resolves.toHaveProperty('items');
  });

  it('filters by category, level and price', async () => {
    expect(slugs(await searchCourses(db, q({ category: 'finance' })))).toEqual(['credoc']);
    expect(slugs(await searchCourses(db, q({ level: 'beginner' })))).toEqual(['cacao']);
    expect(slugs(await searchCourses(db, q({ price: 'free' })))).toEqual(['karite']);
    expect(slugs(await searchCourses(db, q({ price: 'paid', sort: 'price_asc' })))).toEqual(['cacao', 'credoc']);
    expect((await searchCourses(db, q({ category: 'unknown' }))).total).toBe(0);
  });

  it('sorts by rating (unrated last) and price', async () => {
    expect(slugs(await searchCourses(db, q({ sort: 'rating' })))).toEqual(['credoc', 'cacao', 'karite']);
    expect(slugs(await searchCourses(db, q({ sort: 'price_desc' })))).toEqual(['credoc', 'cacao', 'karite']);
  });

  it('paginates', async () => {
    const page2 = await searchCourses(db, q({ page: 2 }));
    expect(page2.items).toHaveLength(0);
    expect(page2.total).toBe(3);
    expect(PAGE_SIZE).toBe(24);
  });
});

describe('getCourseBySlug', () => {
  it('returns ordered curriculum for a published course', async () => {
    const [c] = await db.select().from(courses).where(eq(courses.slug, 'cacao'));
    const s2 = await makeSection(db, c.id, 1, 'Deuxième');
    const s1 = await makeSection(db, c.id, 0, 'Première');
    await makeLesson(db, s1.id, 1, { title: 'B' });
    await makeLesson(db, s1.id, 0, { title: 'A', isPreview: true });
    await makeLesson(db, s2.id, 0, { title: 'C' });
    const detail = await getCourseBySlug(db, 'cacao');
    expect(detail?.sections.map((s) => s.title)).toEqual(['Première', 'Deuxième']);
    expect(detail?.sections[0].lessons.map((l) => [l.title, l.isPreview])).toEqual([['A', true], ['B', false]]);
    expect(detail?.instructor.displayName).toBe('Josette Kameni');
  });

  it('hides drafts and unknown slugs', async () => {
    expect(await getCourseBySlug(db, 'brouillon')).toBeNull();
    expect(await getCourseBySlug(db, 'nope')).toBeNull();
  });
});

describe('getInstructorPage / stats / categories', () => {
  it('returns instructor stats over published courses only', async () => {
    const page = await getInstructorPage(db, instructorId);
    expect(page?.stats).toEqual({ courses: 3, students: 75, ratingAvg: 4.4 }); // (4.2*10 + 4.9*3) / 13 = 4.36 → 4.4
    expect(page?.courses).toHaveLength(3);
  });

  it('returns null for students and unknown ids', async () => {
    const student = await createUser(client, { email: 'student@test.dev' });
    expect(await getInstructorPage(db, student)).toBeNull();
    expect(await getInstructorPage(db, crypto.randomUUID())).toBeNull();
  });

  it('counts platform stats', async () => {
    const student = await createUser(client, { email: 's2@test.dev' });
    const [c] = await db.select().from(courses).where(eq(courses.slug, 'karite'));
    await db.insert(enrollments).values({ userId: student, courseId: c.id, source: 'free' });
    expect(await getPlatformStats(db)).toEqual({ courses: 3, instructors: 1, students: 1 });
  });

  it('lists categories in order', async () => {
    expect((await listCategories(db)).map((c) => c.slug)).toEqual(['negoce', 'finance']);
  });
});
```
Run: `npx vitest run tests/db/catalog.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 4: Implement the queries**

`lib/db/queries/catalog.ts`:
```ts
import 'server-only';
import { and, asc, count, countDistinct, desc, eq, gt, inArray, sql, type SQL } from 'drizzle-orm';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';
import { categories, courses, enrollments, lessons, profiles, sections, type Level } from '../schema';
import type { Db } from '../types';

export type CourseCardData = {
  id: string; slug: string; title: string; subtitle: string; thumbnailPath: string | null;
  priceCents: number; level: Level; ratingAvg: number | null; ratingCount: number;
  enrollmentCount: number; totalDurationSeconds: number; lessonCount: number;
  instructorId: string; instructorName: string; categorySlug: string; categoryName: string;
};

export type CourseDetail = CourseCardData & {
  description: string; outcomes: string[]; requirements: string[]; language: string;
  promoPlaybackId: string | null; updatedAt: Date;
  instructor: { id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null };
  sections: {
    id: string; title: string;
    lessons: { id: string; title: string; kind: 'video' | 'text' | 'quiz'; isPreview: boolean; durationSeconds: number }[];
  }[];
};

export type InstructorPage = {
  id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null;
  stats: { courses: number; students: number; ratingAvg: number | null };
  courses: CourseCardData[];
};

const cardColumns = {
  id: courses.id, slug: courses.slug, title: courses.title, subtitle: courses.subtitle,
  thumbnailPath: courses.thumbnailPath, priceCents: courses.priceCents, level: courses.level,
  ratingAvg: courses.ratingAvg, ratingCount: courses.ratingCount, enrollmentCount: courses.enrollmentCount,
  totalDurationSeconds: courses.totalDurationSeconds, lessonCount: courses.lessonCount,
  instructorId: courses.instructorId, instructorName: profiles.displayName,
  categorySlug: categories.slug, categoryName: categories.name,
};

type CardRow = Omit<CourseCardData, 'ratingAvg'> & { ratingAvg: string | null };
const toCard = (r: CardRow): CourseCardData => ({ ...r, ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg) });

const published = eq(courses.status, 'published');

function cardsQuery(db: Db) {
  return db
    .select(cardColumns)
    .from(courses)
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId));
}

export async function searchCourses(db: Db, q: CatalogQuery): Promise<{ items: CourseCardData[]; total: number }> {
  const conds: SQL[] = [published];
  const tsQuery = q.q ? sql`websearch_to_tsquery('french', ${q.q})` : null;
  if (tsQuery) conds.push(sql`${courses.search} @@ ${tsQuery}`);
  if (q.category) conds.push(eq(categories.slug, q.category));
  if (q.level) conds.push(eq(courses.level, q.level));
  if (q.price === 'free') conds.push(eq(courses.priceCents, 0));
  if (q.price === 'paid') conds.push(gt(courses.priceCents, 0));
  const where = and(...conds);

  const orderBy: SQL[] = {
    popular: [desc(courses.enrollmentCount), desc(courses.publishedAt)],
    rating: [sql`${courses.ratingAvg} desc nulls last`, desc(courses.ratingCount)],
    newest: [desc(courses.publishedAt)],
    price_asc: [asc(courses.priceCents)],
    price_desc: [desc(courses.priceCents)],
  }[q.sort];
  // With a text query, the default ordering is relevance.
  if (tsQuery && q.sort === 'popular') orderBy.unshift(sql`ts_rank(${courses.search}, ${tsQuery}) desc`);

  const [rows, [{ total }]] = await Promise.all([
    cardsQuery(db).where(where).orderBy(...orderBy, asc(courses.id)).limit(PAGE_SIZE).offset((q.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(courses)
      .innerJoin(categories, eq(categories.id, courses.categoryId))
      .where(where),
  ]);
  return { items: rows.map(toCard), total };
}

export async function listCategories(db: Db) {
  return db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.position));
}

export async function getCourseBySlug(db: Db, slug: string): Promise<CourseDetail | null> {
  const [row] = await db
    .select({
      ...cardColumns,
      description: courses.description, outcomes: courses.outcomes, requirements: courses.requirements,
      language: courses.language, promoPlaybackId: courses.promoPlaybackId, updatedAt: courses.updatedAt,
      instructorHeadline: profiles.headline, instructorBio: profiles.bio, instructorAvatar: profiles.avatarPath,
    })
    .from(courses)
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId))
    .where(and(published, eq(courses.slug, slug)))
    .limit(1);
  if (!row) return null;

  const secs = await db.select().from(sections).where(eq(sections.courseId, row.id)).orderBy(asc(sections.position));
  const lessonRows = secs.length
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.sectionId, secs.map((s) => s.id)))
        .orderBy(asc(lessons.position))
    : [];

  const { instructorHeadline, instructorBio, instructorAvatar, ...card } = row;
  return {
    ...toCard(card),
    description: row.description, outcomes: row.outcomes, requirements: row.requirements,
    language: row.language, promoPlaybackId: row.promoPlaybackId, updatedAt: row.updatedAt,
    instructor: { id: row.instructorId, displayName: row.instructorName, headline: instructorHeadline, bio: instructorBio, avatarPath: instructorAvatar },
    sections: secs.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: lessonRows
        .filter((l) => l.sectionId === s.id)
        .map((l) => ({ id: l.id, title: l.title, kind: l.kind, isPreview: l.isPreview, durationSeconds: l.durationSeconds })),
    })),
  };
}

export async function getInstructorPage(db: Db, id: string): Promise<InstructorPage | null> {
  const [p] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!p || p.role === 'student') return null;
  const items = (await cardsQuery(db).where(and(published, eq(courses.instructorId, id))).orderBy(desc(courses.enrollmentCount))).map(toCard);
  if (items.length === 0) return null;

  const rated = items.filter((c) => c.ratingAvg !== null && c.ratingCount > 0);
  const ratingTotal = rated.reduce((t, c) => t + c.ratingCount, 0);
  const ratingAvg = ratingTotal
    ? Math.round((rated.reduce((t, c) => t + c.ratingAvg! * c.ratingCount, 0) / ratingTotal) * 10) / 10
    : null;

  return {
    id: p.id, displayName: p.displayName, headline: p.headline, bio: p.bio, avatarPath: p.avatarPath,
    stats: { courses: items.length, students: items.reduce((t, c) => t + c.enrollmentCount, 0), ratingAvg },
    courses: items,
  };
}

export async function getPlatformStats(db: Db) {
  const [[c], [e]] = await Promise.all([
    db.select({ courses: count(), instructors: countDistinct(courses.instructorId) }).from(courses).where(published),
    db.select({ students: countDistinct(enrollments.userId) }).from(enrollments),
  ]);
  return { courses: c.courses, instructors: c.instructors, students: e.students };
}
```

Run: `npx vitest run tests/db/catalog.test.ts` — Expected: PASS.

- [ ] **Step 5: Cached wrappers**

Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md` first.

`lib/catalog/cached.ts`:
```ts
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db/client';
import {
  getCourseBySlug, getInstructorPage, getPlatformStats, listCategories, searchCourses,
} from '@/lib/db/queries/catalog';
import type { CatalogQuery } from './params';

/** Every public catalog read carries this tag; mutations call updateTag(COURSES_TAG). */
export const COURSES_TAG = 'courses';

export async function cachedSearchCourses(query: CatalogQuery) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG);
  return searchCourses(db, query);
}

export async function cachedPopularCourses(limit = 8) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG);
  const { items } = await searchCourses(db, { sort: 'popular', page: 1 });
  return items.slice(0, limit);
}

export async function cachedCategories() {
  'use cache';
  cacheLife('hours');
  cacheTag(COURSES_TAG);
  return listCategories(db);
}

export async function cachedCourse(slug: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG, `course:${slug}`);
  return getCourseBySlug(db, slug);
}

export async function cachedInstructor(id: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG, `instructor:${id}`);
  return getInstructorPage(db, id);
}

export async function cachedPlatformStats() {
  'use cache';
  cacheLife('hours');
  cacheTag(COURSES_TAG);
  return getPlatformStats(db);
}
```
Run: `npm run typecheck` — Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/catalog lib/db/queries tests/db/catalog.test.ts
git commit -m "feat(catalog): search params, full-text catalog queries, cached readers"
```

---
### Task 6: Supabase auth wiring (clients, proxy, session, roles)

**Files:**
- Create: `lib/supabase/env.ts`, `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/auth/roles.ts`, `lib/auth/session.ts`, `proxy.ts`
- Test: `lib/auth/roles.test.ts`

**Interfaces:**
- Consumes: `profiles`, `Role` (Task 3); `countryToCurrency`, `isDisplayCurrency` (Task 2).
- Produces:
  - `supabaseEnv(): { url: string; key: string }`, `siteUrl(): string`
  - `createSupabaseServerClient(): Promise<SupabaseClient>` (server components, actions, route handlers)
  - `createSupabaseBrowserClient(): SupabaseClient`
  - `hasRole(actual: Role, required: Role): boolean` (admin ⊇ instructor ⊇ student)
  - `safeNextPath(next: string | null | undefined, fallback?: string): string` (default fallback `'/learn'`)
  - `isProtectedPath(pathname: string): boolean`
  - `getUser()`, `getProfile(): Promise<Profile | null>` (React-`cache`d per request; self-heals a missing profile row), `requireUser(nextPath: string): Promise<Profile>`, `requireRole(role: Role, nextPath: string): Promise<Profile>` — `type Profile = typeof profiles.$inferSelect`
  - Cookie `display_currency` always set to a valid `DisplayCurrency` on page requests.

- [ ] **Step 1: Failing tests**

`lib/auth/roles.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { hasRole, isProtectedPath, safeNextPath } from './roles';

describe('hasRole', () => {
  it('orders roles admin > instructor > student', () => {
    expect(hasRole('admin', 'instructor')).toBe(true);
    expect(hasRole('instructor', 'instructor')).toBe(true);
    expect(hasRole('student', 'instructor')).toBe(false);
    expect(hasRole('instructor', 'admin')).toBe(false);
    expect(hasRole('student', 'student')).toBe(true);
  });
});

describe('safeNextPath', () => {
  it('keeps same-site paths with query and hash', () => {
    expect(safeNextPath('/courses/cacao?x=1#top')).toBe('/courses/cacao?x=1#top');
  });
  it.each([
    'https://evil.com', '//evil.com', '/\\evil.com', '\\\\evil.com', 'javascript:alert(1)', 'evil.com', '', null, undefined,
  ])('rejects %j', (value) => {
    expect(safeNextPath(value)).toBe('/learn');
  });
  it('uses a custom fallback', () => expect(safeNextPath('//x', '/')).toBe('/'));
});

describe('isProtectedPath', () => {
  it.each(['/learn', '/teach/x', '/admin', '/account'])('%s is protected', (p) => expect(isProtectedPath(p)).toBe(true));
  it.each(['/', '/courses', '/learning-path', '/administration-info'])('%s is public', (p) => expect(isProtectedPath(p)).toBe(false));
});
```
Run: `npx vitest run lib/auth` — Expected: FAIL.

- [ ] **Step 2: Implement roles**

`lib/auth/roles.ts`:
```ts
import type { Role } from '@/lib/db/schema';

const RANK: Record<Role, number> = { student: 0, instructor: 1, admin: 2 };

export function hasRole(actual: Role, required: Role): boolean {
  return RANK[actual] >= RANK[required];
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(next: string | null | undefined, fallback = '/learn'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  try {
    const base = 'http://local.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

const PROTECTED_PREFIXES = ['/learn', '/teach', '/admin', '/account'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
```
Run: `npx vitest run lib/auth` — Expected: PASS.

- [ ] **Step 3: Supabase clients**

Read `node_modules/next/dist/docs/01-app/02-guides/authentication.md` and `node_modules/@supabase/ssr/README.md` (or its `dist` types) first.

`lib/supabase/env.ts`:
```ts
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set');
  return { url, key };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
```

`lib/supabase/server.ts`:
```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnv } from './env';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
```

`lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
```

- [ ] **Step 4: Session helpers**

`lib/auth/session.ts`:
```ts
import 'server-only';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { profiles, type Role } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasRole } from './roles';

export type Profile = typeof profiles.$inferSelect;

export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) return existing;
  // Self-heal if the signup trigger did not run (e.g. user created before migrations).
  const displayName = (user.user_metadata?.display_name as string | undefined)?.trim() || user.email?.split('@')[0] || 'Apprenant';
  const [created] = await db.insert(profiles).values({ id: user.id, displayName }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1))[0] ?? null;
});

export async function requireUser(nextPath: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return profile;
}

/** Signed-in users without the role get a 404, so private areas are not advertised. */
export async function requireRole(role: Role, nextPath: string): Promise<Profile> {
  const profile = await requireUser(nextPath);
  if (!hasRole(profile.role, role)) notFound();
  return profile;
}
```

- [ ] **Step 5: Proxy**

Read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` first.

`proxy.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isProtectedPath } from '@/lib/auth/roles';
import { countryToCurrency, isDisplayCurrency } from '@/lib/money/currencies';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session cookie when needed. Optimistic check only — pages re-check with requireRole().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;
  if (!signedIn && isProtectedPath(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (!isDisplayCurrency(request.cookies.get('display_currency')?.value)) {
    response.cookies.set('display_currency', countryToCurrency(request.headers.get('x-vercel-ip-country')), {
      path: '/',
      maxAge: ONE_YEAR,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/rates|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
};
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npx vitest run` — Expected: all green.
With `.env.local` present: `npm run dev`, open `/learn` in a private window → redirected to `/login?next=%2Flearn` (404 page is fine until Task 7 adds `/login`). In DevTools, cookie `display_currency=EUR` exists.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase lib/auth proxy.ts
git commit -m "feat(auth): Supabase SSR clients, proxy session refresh, role helpers"
```

---

### Task 7: Auth pages and actions

**Files:**
- Create: `lib/auth/schemas.ts`, `lib/auth/errors.ts`, `app/(auth)/actions.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`, `app/auth/callback/route.ts`, `components/auth/AuthCard.tsx`, `components/auth/AuthCard.module.css`, `components/auth/forms.tsx`
- Test: `lib/auth/schemas.test.ts`, `lib/auth/errors.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServerClient`, `siteUrl`, `safeNextPath`, `getUser`, `requireUser` (Task 6).
- Produces:
  - `type ActionState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined> }`
  - Server actions in `app/(auth)/actions.ts`: `signInAction`, `signUpAction`, `magicLinkAction`, `forgotPasswordAction`, `resetPasswordAction` — all `(prev: ActionState, fd: FormData) => Promise<ActionState>`; plus `googleSignInAction(fd: FormData): Promise<void>` and `signOutAction(): Promise<void>`.
  - Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`.

- [ ] **Step 1: Failing tests**

`lib/auth/schemas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { resetPasswordSchema, signInSchema, signUpSchema } from './schemas';

describe('auth schemas', () => {
  it('normalises email', () => {
    expect(signInSchema.parse({ email: '  Awa@Example.COM ', password: 'x', next: '/learn' }).email).toBe('awa@example.com');
  });

  it('requires 8+ char passwords and a display name on signup', () => {
    const r = signUpSchema.safeParse({ displayName: ' ', email: 'a@b.co', password: 'short' });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['displayName', 'password']));
  });

  it('caps display name length', () => {
    expect(signUpSchema.safeParse({ displayName: 'x'.repeat(81), email: 'a@b.co', password: '12345678' }).success).toBe(false);
  });

  it('requires matching passwords on reset', () => {
    expect(resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345679' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345678' }).success).toBe(true);
  });
});
```

`lib/auth/errors.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './errors';

describe('authErrorMessage', () => {
  it('translates known Supabase codes', () => {
    expect(authErrorMessage('invalid_credentials')).toBe('Email ou mot de passe incorrect.');
    expect(authErrorMessage('email_not_confirmed')).toMatch(/confirmer votre adresse/);
  });
  it('never leaks unknown codes', () => {
    expect(authErrorMessage('some_internal_thing')).toBe('Une erreur est survenue. Réessayez dans un instant.');
    expect(authErrorMessage(undefined)).toBe('Une erreur est survenue. Réessayez dans un instant.');
  });
});
```
Run: `npx vitest run lib/auth` — Expected: FAIL.

- [ ] **Step 2: Implement schemas and errors**

`lib/auth/schemas.ts`:
```ts
import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'Adresse email invalide.' }));
const password = z.string().min(8, { error: 'Au moins 8 caractères.' }).max(72, { error: '72 caractères maximum.' });

export const signInSchema = z.object({ email, password: z.string().min(1, { error: 'Mot de passe requis.' }), next: z.string().optional() });
export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Indiquez votre nom.' }).max(80, { error: '80 caractères maximum.' }),
  email,
  password,
});
export const emailOnlySchema = z.object({ email, next: z.string().optional() });
export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], error: 'Les mots de passe ne correspondent pas.' });
```

`lib/auth/errors.ts`:
```ts
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Vous devez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte mail.',
  user_already_exists: 'Un compte existe déjà avec cette adresse.',
  email_exists: 'Un compte existe déjà avec cette adresse.',
  weak_password: 'Ce mot de passe est trop faible. Choisissez-en un plus long.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_email_send_rate_limit: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  over_request_rate_limit: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  otp_expired: 'Ce lien a expiré. Demandez-en un nouveau.',
};

export function authErrorMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || 'Une erreur est survenue. Réessayez dans un instant.';
}
```
Run: `npx vitest run lib/auth` — Expected: PASS.

- [ ] **Step 3: Server actions**

Read `node_modules/next/dist/docs/01-app/02-guides/forms.md` first.

`app/(auth)/actions.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/roles';
import { emailOnlySchema, resetPasswordSchema, signInSchema, signUpSchema } from '@/lib/auth/schemas';
import { siteUrl } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActionState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined> };

const fields = (fd: FormData) => Object.fromEntries(fd) as Record<string, string>;
const callbackUrl = (next: string) => `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { message: authErrorMessage(error.code) };
  redirect(safeNextPath(parsed.data.next));
}

export async function signUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName }, emailRedirectTo: callbackUrl('/learn') },
  });
  if (error) return { message: authErrorMessage(error.code) };
  if (data.session) redirect('/learn'); // email confirmation disabled
  return { ok: true, message: 'Compte créé. Cliquez sur le lien envoyé par email pour l’activer.' };
}

export async function magicLinkAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(safeNextPath(parsed.data.next)) },
  });
  if (error) return { message: authErrorMessage(error.code) };
  return { ok: true, message: 'Lien de connexion envoyé. Vérifiez votre boîte mail.' };
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: callbackUrl('/reset-password') });
  if (error?.code?.startsWith('over_')) return { message: authErrorMessage(error.code) };
  // Same answer whether or not the account exists (no account enumeration).
  return { ok: true, message: 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.' };
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: authErrorMessage(error.code) };
  redirect('/learn');
}

export async function googleSignInAction(fd: FormData): Promise<void> {
  const next = safeNextPath(String(fd.get('next') ?? ''));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl(next) } });
  if (error || !data.url) redirect('/login?error=oauth');
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
```

- [ ] **Step 4: Callback route**

`app/auth/callback/route.ts`:
```ts
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get('next'));
  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }
  return NextResponse.redirect(new URL(ok ? next : '/login?error=callback', request.url));
}
```

- [ ] **Step 5: UI — card and forms**

`components/auth/AuthCard.module.css`:
```css
.wrap { min-height: calc(100vh - 80px); display: grid; place-items: center; padding: 120px 16px 64px; }
.card {
  width: 100%; max-width: 440px; background: var(--panel-bg); border: 1px solid var(--border-gold);
  border-radius: 16px; padding: clamp(24px, 5vw, 40px);
}
.title { font-size: clamp(1.6rem, 4vw, 2rem); margin: 0 0 8px; }
.subtitle { color: var(--text-muted); margin: 0 0 28px; }
.form { display: grid; gap: 16px; }
.field { display: grid; gap: 6px; }
.label { font-size: 0.875rem; font-weight: 600; color: var(--text-main); }
.input {
  min-height: 46px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-highlight);
  background: var(--bg-card); color: var(--text-main); font: inherit;
}
.input:focus-visible { outline: 2px solid var(--emerald-main); outline-offset: 1px; }
.fieldError { color: #f87171; font-size: 0.8125rem; }
.alert { padding: 12px 14px; border-radius: 8px; font-size: 0.9rem; }
.alertError { background: rgba(248, 113, 113, 0.12); color: #fca5a5; }
.alertOk { background: var(--tint-emerald); color: var(--on-tint-emerald); }
.submit { width: 100%; justify-content: center; }
.divider { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 0.8rem; margin: 8px 0; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
.links { display: flex; justify-content: space-between; gap: 12px; margin-top: 20px; font-size: 0.875rem; flex-wrap: wrap; }
.links a { color: var(--emerald-light); }
.magic { margin-top: 12px; }
.magic summary { cursor: pointer; color: var(--text-muted); font-size: 0.9rem; }
:global([data-theme='light']) .fieldError { color: #b91c1c; }
:global([data-theme='light']) .alertError { color: #991b1b; }
```

`components/auth/AuthCard.tsx`:
```tsx
import type { ReactNode } from 'react';
import styles from './AuthCard.module.css';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
```

`components/auth/forms.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  forgotPasswordAction, googleSignInAction, magicLinkAction, resetPasswordAction, signInAction, signUpAction,
  type ActionState,
} from '@/app/(auth)/actions';
import styles from './AuthCard.module.css';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;
const initial: ActionState = {};

function Field({ id, name, label, type = 'text', autoComplete, state }: {
  id?: string; name: string; label: string; type?: string; autoComplete?: string; state: ActionState;
}) {
  const inputId = id ?? name;
  const error = state.fieldErrors?.[name]?.[0];
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId} name={name} type={type} autoComplete={autoComplete} required className={styles.input}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && <span id={`${inputId}-error`} className={styles.fieldError}>{error}</span>}
    </div>
  );
}

function Alert({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? 'status' : 'alert'} className={`${styles.alert} ${state.ok ? styles.alertOk : styles.alertError}`}>
      {state.message}
    </div>
  );
}

const useForm = (action: Action) => useActionState(action, initial);

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, formAction, pending] = useForm(signInAction);
  const [magic, magicAction, magicPending] = useForm(magicLinkAction);
  return (
    <>
      {error && <Alert state={{ message: error }} />}
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <Alert state={state} />
        <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
        <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" state={state} />
        <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>{pending ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <div className={styles.divider}>ou</div>
      <form action={googleSignInAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <button className={`btn btn-secondary ${styles.submit}`}>Continuer avec Google</button>
      </form>
      <details className={styles.magic}>
        <summary>Recevoir un lien de connexion par email</summary>
        <form action={magicAction} className={styles.form} style={{ marginTop: 12 }}>
          <input type="hidden" name="next" value={next} />
          <Alert state={magic} />
          <Field id="magic-email" name="email" label="Email" type="email" autoComplete="email" state={magic} />
          <button className={`btn btn-secondary ${styles.submit}`} disabled={magicPending}>Envoyer le lien</button>
        </form>
      </details>
      <div className={styles.links}>
        <Link href="/forgot-password">Mot de passe oublié ?</Link>
        <Link href={`/signup?next=${encodeURIComponent(next)}`}>Créer un compte</Link>
      </div>
    </>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useForm(signUpAction);
  if (state.ok) return <Alert state={state} />;
  return (
    <>
      <form action={formAction} className={styles.form}>
        <Alert state={state} />
        <Field name="displayName" label="Nom complet" autoComplete="name" state={state} />
        <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
        <Field name="password" label="Mot de passe (8 caractères minimum)" type="password" autoComplete="new-password" state={state} />
        <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>{pending ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <div className={styles.links}>
        <span>Déjà inscrit ?</span>
        <Link href={`/login?next=${encodeURIComponent(next)}`}>Se connecter</Link>
      </div>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useForm(forgotPasswordAction);
  if (state.ok) return <Alert state={state} />;
  return (
    <form action={formAction} className={styles.form}>
      <Alert state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
      <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>Envoyer le lien</button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useForm(resetPasswordAction);
  return (
    <form action={formAction} className={styles.form}>
      <Alert state={state} />
      <Field name="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" state={state} />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" state={state} />
      <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>Enregistrer</button>
    </form>
  );
}
```

- [ ] **Step 6: Pages**

`app/(auth)/login/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/forms';
import { safeNextPath } from '@/lib/auth/roles';
import { getUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Connexion | Proactive Académie', robots: { index: false } };

const ERRORS: Record<string, string> = {
  callback: 'Ce lien est invalide ou a expiré. Reconnectez-vous ou demandez un nouveau lien.',
  oauth: 'La connexion avec Google a échoué. Réessayez.',
};

async function LoginGate({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === 'string' ? sp.next : null);
  if (await getUser()) redirect(next);
  const error = typeof sp.error === 'string' ? ERRORS[sp.error] : undefined;
  return <LoginForm next={next} error={error} />;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <AuthCard title="Connexion" subtitle="Retrouvez vos formations et votre progression.">
      <Suspense fallback={null}>
        <LoginGate searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
```

`app/(auth)/signup/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignupForm } from '@/components/auth/forms';
import { safeNextPath } from '@/lib/auth/roles';
import { getUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Créer un compte | Proactive Académie' };

async function SignupGate({ searchParams }: { searchParams: PageProps<'/signup'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === 'string' ? sp.next : null);
  if (await getUser()) redirect(next);
  return <SignupForm next={next} />;
}

export default function SignupPage({ searchParams }: PageProps<'/signup'>) {
  return (
    <AuthCard title="Créer un compte" subtitle="Accédez aux formations de Proactive Académie et de nos experts.">
      <Suspense fallback={null}>
        <SignupGate searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
```

`app/(auth)/forgot-password/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/forms';

export const metadata: Metadata = { title: 'Mot de passe oublié | Proactive Académie', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Mot de passe oublié" subtitle="Indiquez votre email, nous vous envoyons un lien de réinitialisation.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
```

`app/(auth)/reset-password/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/forms';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Nouveau mot de passe | Proactive Académie', robots: { index: false } };

async function ResetGate() {
  await requireUser('/reset-password'); // the recovery link signs the user in via /auth/callback
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe">
      <Suspense fallback={null}>
        <ResetGate />
      </Suspense>
    </AuthCard>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run` — Expected: green.
With `.env.local`: in the Supabase dashboard set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect allow-list. Manually: sign up → confirmation email → link → lands on `/learn` (404 until Task 13 — acceptable) with a session cookie; wrong password shows "Email ou mot de passe incorrect."; `/login?next=//evil.com` then login → lands on `/learn`.

- [ ] **Step 8: Commit**

```bash
git add lib/auth "app/(auth)" app/auth components/auth
git commit -m "feat(auth): login, signup, magic link, Google, password reset, callback"
```

---

### Task 8: Shared UI — prices, cards, navbar auth, currency selector

**Files:**
- Create: `lib/media.ts`, `lib/duration.ts`, `lib/labels.ts`, `lib/money/cookie.ts`, `components/catalog/useDisplayCurrency.ts`, `components/catalog/Price.tsx`, `components/catalog/Price.module.css`, `components/catalog/Stars.tsx`, `components/catalog/CourseCard.tsx`, `components/catalog/CourseCard.module.css`, `components/catalog/CourseGrid.tsx`, `app/components/AuthStatus.tsx`, `app/components/UserMenu.tsx`, `app/components/CurrencySelector.tsx`
- Modify: `lib/money/rates.ts` (add `coerceRates`), `app/components/Navbar.tsx`, `app/components/Footer.tsx`, `app/layout.tsx`, `app/globals.css` (append user-menu styles)
- Test: `lib/media.test.ts`, `lib/duration.test.ts`, `lib/money/cookie.test.ts`, `lib/money/rates.test.ts` (extend)

**Interfaces:**
- Consumes: `formatEur`, `formatApprox`, `isDisplayCurrency`, `DISPLAY_CURRENCIES`, `Rates` (Task 2); `CourseCardData` (Task 5); `getProfile` (Task 6); `signOutAction` (Task 7).
- Produces:
  - `thumbnailUrl(path: string | null): string` (local `/…` paths as-is; storage keys → public `course-media` URL; null → `/academy-training.jpg`), `avatarUrl(path: string | null): string | null`
  - `formatDuration(seconds: number): string` (`'45 min'`, `'2 h'`, `'2 h 05 min'`)
  - `LEVEL_LABELS: Record<Level, string>`
  - `CURRENCY_COOKIE = 'display_currency'`, `readCurrencyCookie(cookieHeader: string): DisplayCurrency`, `coerceRates(json: unknown): Rates`
  - `useDisplayCurrency(): { currency: DisplayCurrency; rate: number | undefined }`, `setDisplayCurrency(c: DisplayCurrency): void`
  - `<Price cents={number} size?: 'md' | 'lg' />`, `<Stars rating={number} />`, `<CourseCard course={CourseCardData} />`, `<CourseGrid courses={CourseCardData[]} />`
  - `<Navbar authSlot={ReactNode} drawerAuthSlot={ReactNode} />`, `<AuthStatus variant="bar" | "drawer" />`, `<GuestLinks variant="bar" | "drawer" />`

- [ ] **Step 1: Failing tests**

`lib/media.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarUrl, thumbnailUrl } from './media';

afterEach(() => vi.unstubAllEnvs());

describe('media urls', () => {
  it('passes through local public files', () => expect(thumbnailUrl('/negoce 1.jpeg')).toBe('/negoce 1.jpeg'));
  it('falls back for missing thumbnails', () => expect(thumbnailUrl(null)).toBe('/academy-training.jpg'));
  it('builds storage URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    expect(thumbnailUrl('c1/thumb.webp')).toBe('https://abc.supabase.co/storage/v1/object/public/course-media/c1/thumb.webp');
    expect(avatarUrl('u1/a.png')).toBe('https://abc.supabase.co/storage/v1/object/public/avatars/u1/a.png');
    expect(avatarUrl(null)).toBeNull();
  });
});
```

`lib/duration.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it.each([
    [0, '0 min'], [59, '1 min'], [45 * 60, '45 min'], [2 * 3600, '2 h'], [2 * 3600 + 5 * 60, '2 h 05 min'], [3600 + 59 * 60 + 40, '2 h'],
  ])('%i s → %s', (s, out) => expect(formatDuration(s)).toBe(out));
});
```

`lib/money/cookie.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readCurrencyCookie } from './cookie';

describe('readCurrencyCookie', () => {
  it('reads a valid currency', () => expect(readCurrencyCookie('a=1; display_currency=XOF; b=2')).toBe('XOF'));
  it('ignores tampered or missing values', () => {
    expect(readCurrencyCookie('display_currency=%3Cscript%3E')).toBe('EUR');
    expect(readCurrencyCookie('display_currency=JPY')).toBe('EUR');
    expect(readCurrencyCookie('')).toBe('EUR');
    expect(readCurrencyCookie('my_display_currency=USD')).toBe('EUR');
  });
});
```

Append to `lib/money/rates.test.ts` (merge the import into the existing import line):
```ts
import { coerceRates } from './rates';

describe('coerceRates', () => {
  it('keeps only supported positive numbers', () => {
    expect(coerceRates({ USD: 1.1, GBP: '0.8', JPY: 160, EUR: 1, KES: -1 })).toEqual({ USD: 1.1, EUR: 1 });
    expect(coerceRates(null)).toEqual({});
    expect(coerceRates('nope')).toEqual({});
  });
});
```
Run: `npx vitest run lib` — Expected: FAIL for the new modules.

- [ ] **Step 2: Implement helpers**

`lib/media.ts`:
```ts
const FALLBACK_THUMBNAIL = '/academy-training.jpg';

function storagePublicUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function thumbnailUrl(path: string | null): string {
  if (!path) return FALLBACK_THUMBNAIL;
  if (path.startsWith('/')) return path;
  return storagePublicUrl('course-media', path);
}

export function avatarUrl(path: string | null): string | null {
  return path ? storagePublicUrl('avatars', path) : null;
}
```

`lib/duration.ts`:
```ts
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.ceil(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}
```

`lib/labels.ts`:
```ts
import type { Level } from '@/lib/db/schema';

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  all: 'Tous niveaux',
};
```

`lib/money/cookie.ts`:
```ts
import { isDisplayCurrency, type DisplayCurrency } from './currencies';

export const CURRENCY_COOKIE = 'display_currency';

export function readCurrencyCookie(cookieHeader: string): DisplayCurrency {
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CURRENCY_COOKIE) {
      const value = rest.join('=');
      return isDisplayCurrency(value) ? value : 'EUR';
    }
  }
  return 'EUR';
}
```

Append to `lib/money/rates.ts`:
```ts
/** Validate rates received from our own /api/rates endpoint (already EUR-based). */
export function coerceRates(json: unknown): Rates {
  const out: Rates = {};
  if (typeof json !== 'object' || json === null) return out;
  for (const code of DISPLAY_CURRENCIES) {
    const value = (json as Record<string, unknown>)[code];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[code] = value;
  }
  return out;
}
```
Run: `npx vitest run lib` — Expected: PASS.

- [ ] **Step 3: Client currency hook and Price**

`components/catalog/useDisplayCurrency.ts`:
```ts
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { CURRENCY_COOKIE, readCurrencyCookie } from '@/lib/money/cookie';
import type { DisplayCurrency } from '@/lib/money/currencies';
import { coerceRates, type Rates } from '@/lib/money/rates';

const EVENT = 'display-currency-change';
let ratesPromise: Promise<Rates> | null = null;

function loadRates(): Promise<Rates> {
  ratesPromise ??= fetch('/api/rates')
    .then((r) => (r.ok ? r.json() : null))
    .then(coerceRates)
    .catch(() => ({}));
  return ratesPromise;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useDisplayCurrency(): { currency: DisplayCurrency; rate: number | undefined } {
  const currency = useSyncExternalStore(subscribe, () => readCurrencyCookie(document.cookie), () => 'EUR' as const);
  const [rates, setRates] = useState<Rates>({});
  useEffect(() => {
    if (currency === 'EUR') return;
    let alive = true;
    loadRates().then((r) => {
      if (alive) setRates(r);
    });
    return () => {
      alive = false;
    };
  }, [currency]);
  return { currency, rate: rates[currency] };
}

export function setDisplayCurrency(currency: DisplayCurrency) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}
```

`components/catalog/Price.module.css`:
```css
.price { display: inline-flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-family: 'Outfit', sans-serif; }
.eur { font-weight: 800; color: var(--text-main); font-size: 1.2rem; }
.lg .eur { font-size: 2rem; }
.approx { color: var(--text-muted); font-size: 0.85rem; font-weight: 500; cursor: help; }
```

`components/catalog/Price.tsx`:
```tsx
'use client';

import { formatApprox, formatEur } from '@/lib/money/format';
import styles from './Price.module.css';
import { useDisplayCurrency } from './useDisplayCurrency';

export function Price({ cents, size = 'md' }: { cents: number; size?: 'md' | 'lg' }) {
  const { currency, rate } = useDisplayCurrency();
  const approx = formatApprox(cents, currency, rate);
  return (
    <span className={`${styles.price} ${size === 'lg' ? styles.lg : ''}`}>
      <span className={styles.eur}>{formatEur(cents)}</span>
      {approx && (
        <span className={styles.approx} title="Montant indicatif. Le paiement est effectué en euros.">
          {approx}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Stars, CourseCard, CourseGrid**

`components/catalog/Stars.tsx`:
```tsx
export function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(5, rating)) * 20;
  return (
    <span role="img" aria-label={`Note : ${rating.toFixed(1)} sur 5`} style={{ position: 'relative', display: 'inline-block', letterSpacing: '-1px', color: 'var(--border-highlight)' }}>
      ★★★★★
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, width: `${pct}%`, overflow: 'hidden', color: 'var(--rating-star)' }}>
        ★★★★★
      </span>
    </span>
  );
}
```

`components/catalog/CourseCard.module.css`:
```css
.card {
  display: flex; flex-direction: column; height: 100%;
  background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden;
  color: inherit; text-decoration: none; transition: border-color 0.2s ease, transform 0.2s ease;
}
.card:hover { border-color: var(--border-gold); transform: translateY(-2px); }
.card:focus-visible { outline: 2px solid var(--emerald-main); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .card, .card:hover { transition: none; transform: none; } }
.thumb { position: relative; aspect-ratio: 16 / 9; background: var(--surface-media); }
.thumb img { object-fit: cover; }
.body { display: flex; flex-direction: column; gap: 6px; padding: 16px; flex: 1; font-family: 'Outfit', sans-serif; }
.category { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-main); }
.title {
  font-size: 1.05rem; font-weight: 700; line-height: 1.3; margin: 0; color: var(--text-main);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.instructor { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
.rating { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; }
.ratingValue { font-weight: 700; color: var(--rating-star); }
.muted { color: var(--text-muted); }
.new {
  align-self: flex-start; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  background: var(--tint-emerald); color: var(--on-tint-emerald);
}
.meta { font-size: 0.78rem; color: var(--text-muted); }
.footer { margin-top: auto; padding-top: 10px; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
```

`components/catalog/CourseCard.tsx`:
```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { CourseCardData } from '@/lib/db/queries/catalog';
import { formatDuration } from '@/lib/duration';
import { LEVEL_LABELS } from '@/lib/labels';
import { thumbnailUrl } from '@/lib/media';
import styles from './CourseCard.module.css';
import { Price } from './Price';
import { Stars } from './Stars';

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link href={`/courses/${course.slug}`} className={styles.card}>
      <div className={styles.thumb}>
        <Image src={thumbnailUrl(course.thumbnailPath)} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{course.categoryName}</span>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.instructor}>{course.instructorName}</p>
        {course.ratingAvg !== null && course.ratingCount > 0 ? (
          <div className={styles.rating}>
            <span className={styles.ratingValue}>{course.ratingAvg.toFixed(1)}</span>
            <Stars rating={course.ratingAvg} />
            <span className={styles.muted}>({course.ratingCount})</span>
          </div>
        ) : (
          <span className={styles.new}>Nouveau</span>
        )}
        <span className={styles.meta}>
          {formatDuration(course.totalDurationSeconds)} · {course.lessonCount} leçons · {LEVEL_LABELS[course.level]}
        </span>
        <div className={styles.footer}>
          <Price cents={course.priceCents} />
        </div>
      </div>
    </Link>
  );
}
```

`components/catalog/CourseGrid.tsx`:
```tsx
import type { CourseCardData } from '@/lib/db/queries/catalog';
import { CourseCard } from './CourseCard';
import styles from './CourseCard.module.css';

export function CourseGrid({ courses }: { courses: CourseCardData[] }) {
  return (
    <ul className={styles.grid} role="list">
      {courses.map((c) => (
        <li key={c.id}>
          <CourseCard course={c} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Navbar auth slots and user menu**

`app/components/AuthStatus.tsx`:
```tsx
import Link from 'next/link';
import { getProfile } from '@/lib/auth/session';
import { avatarUrl } from '@/lib/media';
import { UserMenu } from './UserMenu';

export function GuestLinks({ variant }: { variant: 'bar' | 'drawer' }) {
  if (variant === 'drawer') {
    return (
      <>
        <Link href="/login" className="btn btn-secondary">Connexion</Link>
        <Link href="/signup" className="btn btn-primary">Créer un compte</Link>
      </>
    );
  }
  return (
    <div className="nav-auth">
      <Link href="/login" className="nav-auth-login">Connexion</Link>
      <Link href="/signup" className="nav-auth-signup">Créer un compte</Link>
    </div>
  );
}

export async function AuthStatus({ variant }: { variant: 'bar' | 'drawer' }) {
  const profile = await getProfile();
  if (!profile) return <GuestLinks variant={variant} />;
  return <UserMenu variant={variant} name={profile.displayName} role={profile.role} avatar={avatarUrl(profile.avatarPath)} />;
}
```

`app/components/UserMenu.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOutAction } from '@/app/(auth)/actions';

type Role = 'student' | 'instructor' | 'admin';
type Props = { variant: 'bar' | 'drawer'; name: string; role: Role; avatar: string | null };

function menuLinks(role: Role) {
  return [
    { href: '/learn', label: 'Mon apprentissage' },
    { href: '/teach', label: role === 'student' ? 'Devenir formateur' : 'Espace formateur' },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Administration' }] : []),
    { href: '/account', label: 'Mon compte' },
  ];
}

export function UserMenu({ variant, name, role, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'drawer') {
    return (
      <div className="user-menu-drawer">
        {menuLinks(role).map((l) => (
          <Link key={l.href} href={l.href} className="btn btn-secondary">{l.label}</Link>
        ))}
        <form action={signOutAction}>
          <button className="btn btn-secondary" style={{ width: '100%' }}>Déconnexion</button>
        </form>
      </div>
    );
  }

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny avatar from our own storage */}
        {avatar ? <img src={avatar} alt="" width={40} height={40} /> : <span aria-hidden="true">{initials}</span>}
        <span className="sr-only">Menu du compte de {name}</span>
      </button>
      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-name">{name}</div>
          {menuLinks(role).map((l) => (
            <Link key={l.href} href={l.href} role="menuitem" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <form action={signOutAction}>
            <button role="menuitem">Déconnexion</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

Append to `app/globals.css`:
```css
/* ========== USER MENU ========== */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.user-menu { position: relative; }
.user-menu-trigger {
  width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
  background: var(--tint-emerald); color: var(--on-tint-emerald); border: 1px solid var(--border-gold);
  font-weight: 700; font-size: 0.85rem; cursor: pointer;
}
.user-menu-trigger img { width: 100%; height: 100%; object-fit: cover; }
.user-menu-panel {
  position: absolute; right: 0; top: calc(100% + 10px); min-width: 220px; z-index: 50;
  display: grid; padding: 8px; border-radius: 12px; background: var(--panel-bg); border: 1px solid var(--border-gold);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}
.user-menu-name { padding: 8px 12px; font-weight: 700; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; }
.user-menu-panel a, .user-menu-panel button {
  display: block; width: 100%; text-align: left; padding: 10px 12px; border-radius: 8px;
  color: var(--text-main); background: none; border: 0; font: inherit; cursor: pointer;
}
.user-menu-panel a:hover, .user-menu-panel button:hover { background: var(--bg-card-hover); }
.user-menu-drawer { display: grid; gap: 10px; }
```

Modify `app/components/Navbar.tsx`:
1. Signature: `export default function Navbar({ authSlot, drawerAuthSlot }: { authSlot: ReactNode; drawerAuthSlot: ReactNode })` (import `type ReactNode` from `react`).
2. `NAV_LINKS`: replace `{ href: '/#formations', label: 'Formations', hash: true }` with `{ href: '/courses', label: 'Formations' }`; change `isActive` to `(href: string) => !href.includes('#') && (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))`.
3. Replace the whole `<div className="nav-auth">…</div>` block with `{authSlot}`.
4. Replace the children of `<div className="nav-drawer-auth">` with `{drawerAuthSlot}`.

Modify `app/layout.tsx`:
```tsx
import { Suspense } from 'react';
import { AuthStatus, GuestLinks } from './components/AuthStatus';
// …inside <body>, replacing <Navbar />:
<Navbar
  authSlot={<Suspense fallback={<GuestLinks variant="bar" />}><AuthStatus variant="bar" /></Suspense>}
  drawerAuthSlot={<Suspense fallback={<GuestLinks variant="drawer" />}><AuthStatus variant="drawer" /></Suspense>}
/>
```

- [ ] **Step 6: Currency selector in the footer**

`app/components/CurrencySelector.tsx`:
```tsx
'use client';

import { setDisplayCurrency, useDisplayCurrency } from '@/components/catalog/useDisplayCurrency';
import { DISPLAY_CURRENCIES, isDisplayCurrency, type DisplayCurrency } from '@/lib/money/currencies';

const LABELS: Record<DisplayCurrency, string> = {
  EUR: 'Euro (€)', USD: 'Dollar US ($)', GBP: 'Livre sterling (£)', CHF: 'Franc suisse', CAD: 'Dollar canadien',
  XOF: 'Franc CFA (UEMOA)', XAF: 'Franc CFA (CEMAC)', MAD: 'Dirham marocain', NGN: 'Naira nigérian',
  GHS: 'Cedi ghanéen', KES: 'Shilling kényan', ZAR: 'Rand sud-africain',
};

export function CurrencySelector() {
  const { currency } = useDisplayCurrency();
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>Afficher les prix en</span>
      <select
        value={currency}
        onChange={(e) => {
          if (isDisplayCurrency(e.target.value)) setDisplayCurrency(e.target.value);
        }}
        style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 8px', minHeight: 36 }}
      >
        {DISPLAY_CURRENCIES.map((c) => <option key={c} value={c}>{LABELS[c]}</option>)}
      </select>
    </label>
  );
}
```
In `app/components/Footer.tsx`, inside `footer-bottom` before the legal links add:
```tsx
<div style={{ display: 'grid', gap: 6 }}>
  <CurrencySelector />
  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Paiements en euros. Conversion indicative.</span>
</div>
```
(A client component inside the `'use cache'` Footer is fine — it hydrates on the client.)

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run` — Expected: green.
`npm run dev` (with `.env.local`): navbar shows Connexion/Créer un compte when signed out and the avatar menu when signed in (Escape and outside click close it); the footer selector changes currency and updates the `display_currency` cookie.

- [ ] **Step 8: Commit**

```bash
git add lib components app/components app/layout.tsx app/globals.css
git commit -m "feat(ui): course card, price with local approximation, navbar auth menu, currency selector"
```

---
### Task 9: Catalog page `/courses`

**Files:**
- Create: `app/(catalog)/courses/page.tsx`, `app/(catalog)/catalog.module.css`, `components/catalog/CatalogFilters.tsx`, `components/catalog/Pagination.tsx`

**Interfaces:**
- Consumes: `parseCatalogParams`, `catalogHref`, `PAGE_SIZE`, `SORTS`, `LEVELS`, `CatalogQuery` (Task 5); `cachedSearchCourses`, `cachedCategories` (Task 5); `CourseGrid`, `LEVEL_LABELS` (Task 8).
- Produces: public route `/courses`; `catalog.module.css` classes reused by Task 11 (`page`, `header`, `skeleton`).

- [ ] **Step 1: Styles**

`app/(catalog)/catalog.module.css`:
```css
.page { padding: 140px 0 80px; }
.header { margin-bottom: 32px; }
.header h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 8px; }
.layout { display: grid; gap: 32px; }
@media (min-width: 960px) { .layout { grid-template-columns: 260px 1fr; align-items: start; } }
.filters { display: grid; gap: 20px; }
@media (min-width: 960px) { .sticky { position: sticky; top: 110px; } }
.filterGroup { display: grid; gap: 8px; }
.filterLabel { font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.select, .search {
  min-height: 44px; padding: 8px 12px; border-radius: 8px; width: 100%;
  border: 1px solid var(--border-highlight); background: var(--bg-card); color: var(--text-main); font: inherit;
}
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.count { color: var(--text-muted); margin: 0; }
.empty { text-align: center; padding: 64px 16px; border: 1px dashed var(--border-highlight); border-radius: 12px; display: grid; gap: 12px; justify-items: center; }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 40px; flex-wrap: wrap; }
.pageLink {
  min-width: 44px; min-height: 44px; display: grid; place-items: center; padding: 0 12px;
  border-radius: 8px; border: 1px solid var(--border-subtle); color: var(--text-main);
}
.pageLink[aria-current='page'] { background: var(--cta-emerald-bg); color: var(--cta-emerald-fg); border-color: transparent; font-weight: 700; }
.toggle summary { cursor: pointer; font-weight: 700; padding: 12px 0; }
@media (min-width: 960px) { .toggle summary { display: none; } }
.skeleton { min-height: 320px; border-radius: 12px; background: var(--bg-card); animation: pulse 1.4s ease-in-out infinite; }
.skeletonGrid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
@keyframes pulse { 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
```

- [ ] **Step 2: Filters — a GET form (works without JS) that navigates on change when JS is on**

`components/catalog/CatalogFilters.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import styles from '@/app/(catalog)/catalog.module.css';
import { catalogHref } from '@/lib/catalog/href';
import { LEVELS, SORTS, type CatalogQuery, type Sort } from '@/lib/catalog/params';
import { LEVEL_LABELS } from '@/lib/labels';

const SORT_LABELS: Record<Sort, string> = {
  popular: 'Les plus populaires', rating: 'Les mieux notés', newest: 'Les plus récents',
  price_asc: 'Prix croissant', price_desc: 'Prix décroissant',
};

export function CatalogFilters({ query, categories }: { query: CatalogQuery; categories: { slug: string; name: string }[] }) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) as string | null)?.trim() || undefined;
    router.push(
      catalogHref(query, {
        q: val('q'),
        category: val('category'),
        level: val('level') as CatalogQuery['level'],
        price: val('price') as CatalogQuery['price'],
        sort: (val('sort') as Sort | undefined) ?? 'popular',
      }),
    );
  }

  return (
    <form
      action="/courses"
      method="get"
      role="search"
      className={`${styles.filters} ${styles.sticky}`}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === 'SELECT') apply(e.currentTarget);
      }}
    >
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="q">Rechercher</label>
        <input id="q" name="q" type="search" defaultValue={query.q} placeholder="Cacao, Incoterms, Credoc…" className={styles.search} maxLength={100} />
      </div>
      <details className={styles.toggle} open>
        <summary>Filtres et tri</summary>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="category">Catégorie</label>
            <select id="category" name="category" defaultValue={query.category ?? ''} className={styles.select}>
              <option value="">Toutes</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="level">Niveau</label>
            <select id="level" name="level" defaultValue={query.level ?? ''} className={styles.select}>
              <option value="">Tous</option>
              {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="price">Prix</label>
            <select id="price" name="price" defaultValue={query.price ?? ''} className={styles.select}>
              <option value="">Tous</option>
              <option value="free">Gratuit</option>
              <option value="paid">Payant</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="sort">Trier par</label>
            <select id="sort" name="sort" defaultValue={query.sort} className={styles.select}>
              {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Rechercher</button>
        </div>
      </details>
    </form>
  );
}
```

`components/catalog/Pagination.tsx`:
```tsx
import Link from 'next/link';
import styles from '@/app/(catalog)/catalog.module.css';
import { catalogHref } from '@/lib/catalog/href';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';

export function Pagination({ query, total }: { query: CatalogQuery; total: number }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - query.page) <= 2);
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {query.page > 1 && <Link className={styles.pageLink} href={catalogHref(query, { page: query.page - 1 })}>Précédent</Link>}
      {nums.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && p - nums[i - 1] > 1 && <span className={styles.pageLink} aria-hidden="true">…</span>}
          <Link className={styles.pageLink} href={catalogHref(query, { page: p })} aria-current={p === query.page ? 'page' : undefined}>{p}</Link>
        </span>
      ))}
      {query.page < pages && <Link className={styles.pageLink} href={catalogHref(query, { page: query.page + 1 })}>Suivant</Link>}
    </nav>
  );
}
```

- [ ] **Step 3: Page**

`app/(catalog)/courses/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { Pagination } from '@/components/catalog/Pagination';
import { cachedCategories, cachedSearchCourses } from '@/lib/catalog/cached';
import { parseCatalogParams } from '@/lib/catalog/params';
import styles from '../catalog.module.css';

export const metadata: Metadata = {
  title: 'Catalogue des formations | Proactive Académie',
  description: 'Formations en négoce, import-export, logistique, finance et douane, par Proactive Services et des experts du commerce international.',
};

function CatalogSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true">
      <div className={styles.skeleton} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeleton} />)}
      </div>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<'/courses'>['searchParams'] }) {
  const query = parseCatalogParams(await searchParams);
  const [{ items, total }, categories] = await Promise.all([cachedSearchCourses(query), cachedCategories()]);
  return (
    <div className={styles.layout}>
      <aside aria-label="Filtres">
        {/* key resets the uncontrolled inputs when the URL changes */}
        <CatalogFilters key={JSON.stringify(query)} query={query} categories={categories} />
      </aside>
      <div>
        <div className={styles.toolbar}>
          <p className={styles.count} aria-live="polite">
            {total} formation{total > 1 ? 's' : ''}
            {query.q ? ` pour « ${query.q} »` : ''}
          </p>
        </div>
        {items.length ? (
          <CourseGrid courses={items} />
        ) : (
          <div className={styles.empty}>
            <h2 style={{ margin: 0 }}>Aucune formation ne correspond</h2>
            <p className="text-muted" style={{ margin: 0 }}>Essayez d’autres mots-clés ou retirez des filtres.</p>
            <Link href="/courses" className="btn btn-secondary">Voir toutes les formations</Link>
          </div>
        )}
        <Pagination query={query} total={total} />
      </div>
    </div>
  );
}

export default function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  return (
    <section className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1>
            Catalogue des <span style={{ color: 'var(--gold-main)' }}>formations</span>
          </h1>
          <p className="text-lead">Négoce, import-export, logistique, finance : apprenez auprès de praticiens.</p>
        </header>
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint` — Expected: green.
With the seeded DB, `npm run dev`:
- `/courses` lists 8 courses; `?q=credoc` → "Sécurisation des Paiements (Credoc)"; `?q=%22` → empty state, no error; `?page=abc&sort=drop` → normal listing.
- Changing a select updates the URL and results; the back button restores the previous filters.
- With JavaScript disabled, submitting the form still filters.
- At 375px width: no horizontal scroll; filters collapsible.

- [ ] **Step 5: Commit**

```bash
git add "app/(catalog)" components/catalog
git commit -m "feat(catalog): /courses with full-text search, filters, sort and pagination"
```

---

### Task 10: Course detail page and free enrollment

**Files:**
- Create: `lib/markdown.ts`, `lib/db/queries/enrollment.ts`, `app/(catalog)/courses/[slug]/page.tsx`, `app/(catalog)/courses/[slug]/actions.ts`, `app/(catalog)/courses/[slug]/course.module.css`, `components/catalog/Curriculum.tsx`, `components/catalog/PurchaseCta.tsx`
- Modify: `app/globals.css` (curriculum styles)
- Test: `lib/markdown.test.ts`, `tests/db/enrollment.test.ts`

**Interfaces:**
- Consumes: `cachedCourse`, `COURSES_TAG`, `CourseDetail`, `CourseCardData` (Task 5); `getProfile`, `requireUser` (Task 6); `Price`, `Stars`, `formatDuration`, `LEVEL_LABELS`, `thumbnailUrl`, `avatarUrl` (Task 8).
- Produces:
  - `renderMarkdown(md: string): string` (sanitised HTML)
  - `type EnrollResult = 'enrolled' | 'already_enrolled' | 'not_found' | 'not_free'`
  - `enrollInFreeCourse(db: Db, userId: string, courseId: string): Promise<EnrollResult>`
  - `isEnrolled(db: Db, userId: string, courseId: string): Promise<boolean>`
  - `listEnrolledCourses(db: Db, userId: string): Promise<CourseCardData[]>` (most recent enrollment first)
  - `enrollFreeAction(formData: FormData): Promise<void>` (fields `courseId`, `slug`)
  - Route `/courses/[slug]`

- [ ] **Step 1: Failing tests**

`lib/markdown.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs, emphasis and lists', () => {
    const html = renderMarkdown('Bonjour **monde**\n\n- un\n- deux');
    expect(html).toContain('<strong>monde</strong>');
    expect(html).toContain('<li>un</li>');
  });
  it('strips scripts, event handlers and javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>[x](javascript:alert(1))');
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });
  it('makes links safe', () => {
    expect(renderMarkdown('[site](https://example.com)')).toContain('rel="noopener noreferrer nofollow"');
  });
});
```

`tests/db/enrollment.test.ts`:
```ts
import type { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { enrollInFreeCourse, isEnrolled, listEnrolledCourses } from '@/lib/db/queries/enrollment';
import { courses, enrollments } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;
let free: { id: string };
let paid: { id: string };
let draft: { id: string };

beforeAll(async () => {
  ({ client, db } = await createTestDb());
  const instructorId = await makeInstructor(client, db);
  const cat = await makeCategory(db);
  free = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0 });
  paid = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 4900 });
  draft = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0, status: 'draft' });
});

const countOf = async (id: string) => (await db.select().from(courses).where(eq(courses.id, id)))[0].enrollmentCount;

describe('enrollInFreeCourse', () => {
  it('enrolls once and increments the counter once', async () => {
    const user = await createUser(client, { email: 'a@test.dev' });
    expect(await enrollInFreeCourse(db, user, free.id)).toBe('enrolled');
    expect(await enrollInFreeCourse(db, user, free.id)).toBe('already_enrolled');
    expect(await countOf(free.id)).toBe(1);
    expect(await isEnrolled(db, user, free.id)).toBe(true);
  });

  it('handles concurrent double-submits without double counting', async () => {
    const user = await createUser(client, { email: 'b@test.dev' });
    const results = await Promise.all([enrollInFreeCourse(db, user, free.id), enrollInFreeCourse(db, user, free.id)]);
    expect([...results].sort()).toEqual(['already_enrolled', 'enrolled']);
    expect(await countOf(free.id)).toBe(2);
  });

  it('refuses paid, unpublished and unknown courses', async () => {
    const user = await createUser(client, { email: 'c@test.dev' });
    expect(await enrollInFreeCourse(db, user, paid.id)).toBe('not_free');
    expect(await enrollInFreeCourse(db, user, draft.id)).toBe('not_found');
    expect(await enrollInFreeCourse(db, user, crypto.randomUUID())).toBe('not_found');
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, user))).toHaveLength(0);
    expect(await countOf(paid.id)).toBe(0);
  });

  it('lists a user’s courses newest first', async () => {
    const user = await createUser(client, { email: 'd@test.dev' });
    await db.insert(enrollments).values({ userId: user, courseId: paid.id, source: 'admin', createdAt: new Date('2026-01-01') });
    await enrollInFreeCourse(db, user, free.id);
    expect((await listEnrolledCourses(db, user)).map((c) => c.id)).toEqual([free.id, paid.id]);
    expect(await isEnrolled(db, user, draft.id)).toBe(false);
  });
});
```
Run: `npx vitest run lib/markdown.test.ts tests/db/enrollment.test.ts` — Expected: FAIL.

- [ ] **Step 2: Implement markdown and enrollment**

`lib/markdown.ts`:
```ts
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false, gfm: true }) as string;
  return sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'hr'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
    },
  });
}
```

`lib/db/queries/enrollment.ts`:
```ts
import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { categories, courses, enrollments, profiles } from '../schema';
import type { Db } from '../types';
import type { CourseCardData } from './catalog';

export type EnrollResult = 'enrolled' | 'already_enrolled' | 'not_found' | 'not_free';

export async function enrollInFreeCourse(db: Db, userId: string, courseId: string): Promise<EnrollResult> {
  return db.transaction(async (tx) => {
    const [course] = await tx
      .select({ priceCents: courses.priceCents })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, 'published')))
      .limit(1);
    if (!course) return 'not_found';
    if (course.priceCents > 0) return 'not_free';

    // The unique (user_id, course_id) constraint makes double submits safe.
    const inserted = await tx
      .insert(enrollments)
      .values({ userId, courseId, source: 'free' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
      .returning({ id: enrollments.id });
    if (inserted.length === 0) return 'already_enrolled';

    await tx.update(courses).set({ enrollmentCount: sql`${courses.enrollmentCount} + 1` }).where(eq(courses.id, courseId));
    return 'enrolled';
  });
}

export async function isEnrolled(db: Db, userId: string, courseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return Boolean(row);
}

export async function listEnrolledCourses(db: Db, userId: string): Promise<CourseCardData[]> {
  const rows = await db
    .select({
      id: courses.id, slug: courses.slug, title: courses.title, subtitle: courses.subtitle,
      thumbnailPath: courses.thumbnailPath, priceCents: courses.priceCents, level: courses.level,
      ratingAvg: courses.ratingAvg, ratingCount: courses.ratingCount, enrollmentCount: courses.enrollmentCount,
      totalDurationSeconds: courses.totalDurationSeconds, lessonCount: courses.lessonCount,
      instructorId: courses.instructorId, instructorName: profiles.displayName,
      categorySlug: categories.slug, categoryName: categories.name,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.createdAt));
  return rows.map((r) => ({ ...r, ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg) }));
}
```
Run: `npx vitest run lib/markdown.test.ts tests/db/enrollment.test.ts` — Expected: PASS. (PGlite runs one connection, so the "concurrent" test exercises the idempotency path; the unique constraint is what guarantees it in production.)

- [ ] **Step 3: Server action**

`app/(catalog)/courses/[slug]/actions.ts`:
```ts
'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { COURSES_TAG } from '@/lib/catalog/cached';
import { db } from '@/lib/db/client';
import { enrollInFreeCourse } from '@/lib/db/queries/enrollment';

const input = z.object({ courseId: z.uuid(), slug: z.string().regex(/^[a-z0-9-]{1,120}$/) });

export async function enrollFreeAction(formData: FormData): Promise<void> {
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/courses');
  const { courseId, slug } = parsed.data;
  const profile = await requireUser(`/courses/${slug}`);
  const result = await enrollInFreeCourse(db, profile.id, courseId);
  if (result === 'enrolled') updateTag(COURSES_TAG);
  redirect(result === 'enrolled' || result === 'already_enrolled' ? '/learn' : `/courses/${slug}`);
}
```

- [ ] **Step 4: Components**

`components/catalog/Curriculum.tsx`:
```tsx
import type { CourseDetail } from '@/lib/db/queries/catalog';
import { formatDuration } from '@/lib/duration';

const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

export function Curriculum({ sections }: { sections: CourseDetail['sections'] }) {
  const lessonCount = sum(sections.map((s) => s.lessons.length));
  const total = sum(sections.flatMap((s) => s.lessons.map((l) => l.durationSeconds)));
  return (
    <div className="curriculum">
      <p className="text-muted" style={{ margin: 0 }}>
        {sections.length} sections · {lessonCount} leçons · {formatDuration(total)} au total
      </p>
      {sections.map((s, i) => (
        <details key={s.id} open={i === 0} className="curriculum-section">
          <summary>
            <span>{s.title}</span>
            <span className="text-muted">
              {s.lessons.length} leçons · {formatDuration(sum(s.lessons.map((l) => l.durationSeconds)))}
            </span>
          </summary>
          <ul>
            {s.lessons.map((l) => (
              <li key={l.id}>
                <span>{l.title}</span>
                <span className="curriculum-meta">
                  {l.isPreview && <span className="curriculum-preview">Aperçu</span>}
                  {formatDuration(l.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
```

Append to `app/globals.css`:
```css
/* ========== CURRICULUM ========== */
.curriculum { display: grid; gap: 8px; }
.curriculum-section { border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-card); }
.curriculum-section summary {
  display: flex; justify-content: space-between; gap: 16px; padding: 14px 16px; cursor: pointer; font-weight: 700; flex-wrap: wrap;
}
.curriculum-section ul { list-style: none; margin: 0; padding: 0 16px 12px; }
.curriculum-section li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-top: 1px solid var(--border-subtle); }
.curriculum-meta { display: inline-flex; gap: 10px; color: var(--text-muted); white-space: nowrap; font-size: 0.875rem; }
.curriculum-preview { color: var(--emerald-light); font-weight: 600; }
```

`components/catalog/PurchaseCta.tsx` (the course player arrives in Phase 2, so enrolled users get a status, not a dead link):
```tsx
import Link from 'next/link';
import { enrollFreeAction } from '@/app/(catalog)/courses/[slug]/actions';
import { getProfile } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { isEnrolled } from '@/lib/db/queries/enrollment';

const full = { width: '100%', justifyContent: 'center' } as const;

export async function PurchaseCta({ courseId, slug, priceCents }: { courseId: string; slug: string; priceCents: number }) {
  const profile = await getProfile();
  if (!profile) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn btn-primary" style={full}>
        Se connecter pour s’inscrire
      </Link>
    );
  }
  if (await isEnrolled(db, profile.id, courseId)) {
    return (
      <div role="status">
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--emerald-light)' }}>Vous êtes inscrit à cette formation.</p>
        <Link href="/learn" className="btn btn-secondary" style={full}>Mon apprentissage</Link>
      </div>
    );
  }
  if (priceCents === 0) {
    return (
      <form action={enrollFreeAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <button className="btn btn-primary" style={full}>S’inscrire gratuitement</button>
      </form>
    );
  }
  return (
    <>
      <button className="btn btn-primary" disabled aria-describedby="pay-soon" style={full}>Acheter</button>
      <p id="pay-soon" className="text-muted" style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>Paiement en ligne bientôt disponible.</p>
    </>
  );
}
```

- [ ] **Step 5: Page**

`app/(catalog)/courses/[slug]/course.module.css`:
```css
.hero { padding: 140px 0 48px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); }
.heroGrid { display: grid; gap: 32px; }
@media (min-width: 1024px) { .heroGrid { grid-template-columns: 1fr 360px; } }
.crumbs { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
.crumbs a { color: var(--emerald-light); }
.title { font-size: clamp(1.9rem, 4.5vw, 2.8rem); margin: 0 0 12px; }
.subtitle { font-size: 1.15rem; color: var(--text-main); margin: 0 0 16px; max-width: 720px; }
.facts { display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--text-muted); font-size: 0.9rem; }
.facts a { color: var(--emerald-light); }
.card { background: var(--panel-bg); border: 1px solid var(--border-gold); border-radius: 14px; overflow: hidden; align-self: start; }
@media (min-width: 1024px) { .card { position: sticky; top: 100px; } }
.cardMedia { position: relative; aspect-ratio: 16 / 9; }
.cardMedia img { object-fit: cover; }
.cardBody { padding: 20px; display: grid; gap: 14px; }
.content { padding: 48px 0 96px; }
.main { max-width: 760px; }
.block { margin-bottom: 40px; }
.block h2 { font-size: 1.5rem; margin: 0 0 16px; }
.outcomes { display: grid; gap: 10px 24px; padding: 20px; border: 1px solid var(--border-subtle); border-radius: 12px; list-style: none; margin: 0; }
@media (min-width: 720px) { .outcomes { grid-template-columns: 1fr 1fr; } }
.outcomes li::before { content: '✓'; color: var(--emerald-main); font-weight: 700; margin-right: 10px; }
.prose { line-height: 1.8; color: var(--text-main); }
.instructor { display: flex; gap: 16px; align-items: flex-start; }
.avatar {
  width: 72px; height: 72px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: grid; place-items: center;
  background: var(--tint-emerald); color: var(--on-tint-emerald); font-weight: 700; font-size: 1.4rem;
}
```

`app/(catalog)/courses/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Curriculum } from '@/components/catalog/Curriculum';
import { Price } from '@/components/catalog/Price';
import { PurchaseCta } from '@/components/catalog/PurchaseCta';
import { Stars } from '@/components/catalog/Stars';
import { cachedCourse } from '@/lib/catalog/cached';
import { formatDuration } from '@/lib/duration';
import { LEVEL_LABELS } from '@/lib/labels';
import { renderMarkdown } from '@/lib/markdown';
import { avatarUrl, thumbnailUrl } from '@/lib/media';
import styles from './course.module.css';

const SLUG = /^[a-z0-9-]{1,120}$/;
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

async function loadCourse(params: PageProps<'/courses/[slug]'>['params']) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return null; // junk URLs must not create cache entries
  return cachedCourse(slug);
}

export async function generateMetadata({ params }: PageProps<'/courses/[slug]'>): Promise<Metadata> {
  const course = await loadCourse(params);
  if (!course) return { title: 'Formation introuvable | Proactive Académie' };
  return {
    title: `${course.title} | Proactive Académie`,
    description: course.subtitle,
    openGraph: { title: course.title, description: course.subtitle, images: [thumbnailUrl(course.thumbnailPath)] },
  };
}

async function CourseView({ params }: { params: PageProps<'/courses/[slug]'>['params'] }) {
  const course = await loadCourse(params);
  if (!course) notFound();
  const avatar = avatarUrl(course.instructor.avatarPath);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <nav className={styles.crumbs} aria-label="Fil d’Ariane">
              <Link href="/courses">Formations</Link> › <Link href={`/courses?category=${course.categorySlug}`}>{course.categoryName}</Link>
            </nav>
            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.subtitle}>{course.subtitle}</p>
            <div className={styles.facts}>
              {course.ratingAvg !== null && course.ratingCount > 0 ? (
                <span>
                  <strong style={{ color: 'var(--rating-star)' }}>{course.ratingAvg.toFixed(1)}</strong> <Stars rating={course.ratingAvg} /> ({course.ratingCount} avis)
                </span>
              ) : (
                <span>Nouvelle formation</span>
              )}
              {course.enrollmentCount > 0 && <span>{course.enrollmentCount} apprenants</span>}
              <span>Par <Link href={`/instructors/${course.instructor.id}`}>{course.instructor.displayName}</Link></span>
              <span>{LEVEL_LABELS[course.level]}</span>
              <span>{formatDuration(course.totalDurationSeconds)} · {course.lessonCount} leçons</span>
              <span>Mise à jour : {monthYear.format(course.updatedAt)}</span>
              <span>Français</span>
            </div>
          </div>
          <aside className={styles.card} aria-label="Inscription">
            <div className={styles.cardMedia}>
              <Image src={thumbnailUrl(course.thumbnailPath)} alt="" fill sizes="(max-width: 1024px) 100vw, 360px" priority />
            </div>
            <div className={styles.cardBody}>
              <Price cents={course.priceCents} size="lg" />
              <Suspense fallback={<div style={{ height: 48 }} />}>
                <PurchaseCta courseId={course.id} slug={course.slug} priceCents={course.priceCents} />
              </Suspense>
              <ul className="text-muted" style={{ fontSize: '0.875rem', paddingLeft: 18, margin: 0 }}>
                <li>Accès illimité</li>
                <li>Certificat de réussite</li>
                <li>Paiement en euros</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.content}>
        <div className={`container ${styles.main}`}>
          {course.outcomes.length > 0 && (
            <div className={styles.block}>
              <h2>Ce que vous apprendrez</h2>
              <ul className={styles.outcomes}>{course.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
          <div className={styles.block}>
            <h2>Programme</h2>
            <Curriculum sections={course.sections} />
          </div>
          {course.requirements.length > 0 && (
            <div className={styles.block}>
              <h2>Prérequis</h2>
              <ul>{course.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          <div className={styles.block}>
            <h2>Description</h2>
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(course.description) }} />
          </div>
          <div className={styles.block}>
            <h2>Votre formateur</h2>
            <div className={styles.instructor}>
              {avatar ? (
                <Image src={avatar} alt="" width={72} height={72} className={styles.avatar} />
              ) : (
                <span className={styles.avatar} aria-hidden="true">{course.instructor.displayName[0]}</span>
              )}
              <div>
                <Link href={`/instructors/${course.instructor.id}`}><strong>{course.instructor.displayName}</strong></Link>
                {course.instructor.headline && <p className="text-muted" style={{ margin: '4px 0' }}>{course.instructor.headline}</p>}
                {course.instructor.bio && <p style={{ margin: 0 }}>{course.instructor.bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CoursePage({ params }: PageProps<'/courses/[slug]'>) {
  return (
    <Suspense fallback={<div className={styles.hero} style={{ minHeight: 420 }} aria-busy="true" />}>
      <CourseView params={params} />
    </Suspense>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run` — Expected: green.
With the seeded DB: `/courses/fondements-negoce-international` shows the hero, sticky card on desktop, curriculum (first section open), instructor. Signed out → "Se connecter pour s’inscrire" → login → returns to the course. `/courses/does-not-exist` and `/courses/%3Cscript%3E` → branded 404. In the Supabase SQL editor set one course's `price_cents = 0`, enroll → redirected to `/learn`; reload the course page → "Vous êtes inscrit"; then restore the price.

- [ ] **Step 7: Commit**

```bash
git add lib/markdown.ts lib/markdown.test.ts lib/db/queries/enrollment.ts tests/db/enrollment.test.ts "app/(catalog)/courses/[slug]" components/catalog app/globals.css
git commit -m "feat(course): course detail page, curriculum, free enrollment"
```

---

### Task 11: Instructor profile page

**Files:**
- Create: `app/(catalog)/instructors/[id]/page.tsx`

**Interfaces:**
- Consumes: `cachedInstructor`, `InstructorPage` (Task 5); `CourseGrid`, `Stars`, `avatarUrl` (Task 8); `catalog.module.css` (Task 9).
- Produces: public route `/instructors/[id]`.

- [ ] **Step 1: Page**

`app/(catalog)/instructors/[id]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { cachedInstructor } from '@/lib/catalog/cached';
import { avatarUrl } from '@/lib/media';
import styles from '../../catalog.module.css';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(params: PageProps<'/instructors/[id]'>['params']) {
  const { id } = await params;
  return UUID.test(id) ? cachedInstructor(id.toLowerCase()) : null;
}

export async function generateMetadata({ params }: PageProps<'/instructors/[id]'>): Promise<Metadata> {
  const p = await load(params);
  return p
    ? { title: `${p.displayName} | Formateur Proactive Académie`, description: p.headline ?? undefined }
    : { title: 'Formateur introuvable | Proactive Académie' };
}

async function InstructorView({ params }: { params: PageProps<'/instructors/[id]'>['params'] }) {
  const p = await load(params);
  if (!p) notFound();
  const avatar = avatarUrl(p.avatarPath);
  const stat = (value: string, label: string) => (
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading)' }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
  return (
    <>
      <header className={styles.header} style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {avatar ? (
          <Image src={avatar} alt="" width={112} height={112} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span aria-hidden="true" style={{ width: 112, height: 112, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '2.5rem', fontWeight: 700, background: 'var(--tint-emerald)', color: 'var(--on-tint-emerald)' }}>
            {p.displayName[0]}
          </span>
        )}
        <div>
          <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>Formateur</p>
          <h1 style={{ margin: '4px 0' }}>{p.displayName}</h1>
          {p.headline && <p className="text-lead" style={{ margin: 0 }}>{p.headline}</p>}
        </div>
      </header>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 32 }}>
        {stat(String(p.stats.courses), p.stats.courses > 1 ? 'formations' : 'formation')}
        {stat(String(p.stats.students), 'apprenants')}
        {p.stats.ratingAvg !== null && stat(p.stats.ratingAvg.toFixed(1), 'note moyenne')}
      </div>
      {p.bio && <p style={{ maxWidth: 760, lineHeight: 1.8, marginBottom: 48, whiteSpace: 'pre-line' }}>{p.bio}</p>}
      <h2 style={{ marginBottom: 24 }}>Formations de {p.displayName}</h2>
      <CourseGrid courses={p.courses} />
    </>
  );
}

export default function InstructorPage({ params }: PageProps<'/instructors/[id]'>) {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<div className={styles.skeleton} aria-busy="true" />}>
          <InstructorView params={params} />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint` — Expected: green.
With the seeded DB: click the instructor link on a course page → profile with 8 courses and "0 apprenants"; `/instructors/not-a-uuid` and the UUID of a student → 404.

- [ ] **Step 3: Commit**

```bash
git add "app/(catalog)/instructors"
git commit -m "feat(catalog): public instructor profile page"
```

---

### Task 12: Home page reads the real catalog

The hardcoded 8 courses, the fake "4.9 (320)" ratings and the `<style jsx>` block are removed. The page becomes a Server Component so it can read cached data; the scroll/counter effects move into a tiny client island.

**Files:**
- Create: `app/(marketing)/HomeEffects.tsx`
- Modify: `app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `cachedPopularCourses`, `cachedPlatformStats` (Task 5); `CourseGrid` (Task 8); `useScrollAnimations`, `useCounterAnimation`, `useParallax` from `app/hooks.ts`.
- Produces: `/` with "Formations populaires" from the DB, catalogue counts, and a "Devenir formateur" CTA.

- [ ] **Step 1: Client island**

`app/(marketing)/HomeEffects.tsx`:
```tsx
'use client';

import { useCounterAnimation, useParallax, useScrollAnimations } from '@/app/hooks';

/** Runs the existing DOM-driven animations; renders nothing. */
export function HomeEffects() {
  useScrollAnimations();
  useCounterAnimation();
  useParallax('.image-frame img');
  return null;
}
```

- [ ] **Step 2: Convert the page**

In `app/(marketing)/page.tsx`:
1. Remove `'use client'` and the `useScrollAnimations/useCounterAnimation/useParallax` import and calls; remove the `next/image` import if it becomes unused.
2. Make the component `export default async function HomePage()` and fetch:
```tsx
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { cachedPlatformStats, cachedPopularCourses } from '@/lib/catalog/cached';
import { HomeEffects } from './HomeEffects';
// …
const [popular, stats] = await Promise.all([cachedPopularCourses(8), cachedPlatformStats()]);
```
3. Render `<HomeEffects />` as the first child of the fragment.
4. Replace the entire `COURSE CATALOGUE` section (from `<section className="section course-section">` through its closing `</section>`, including the `<style jsx>` block) with:
```tsx
<section id="formations" className="section course-section">
  <div className="container">
    <div className="fade-up" style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '15px' }}>
        Formations <span style={{ color: 'var(--gold-main)' }}>populaires.</span>
      </h2>
      <p className="text-lead" style={{ maxWidth: '700px', margin: 0 }}>
        {stats.courses} formations par {stats.instructors} formateur{stats.instructors > 1 ? 's' : ''} pour propulser votre carrière dans le commerce international.
      </p>
    </div>
    {popular.length > 0 ? (
      <CourseGrid courses={popular} />
    ) : (
      <p className="text-muted">Les premières formations arrivent très bientôt.</p>
    )}
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 40 }}>
      <Link href="/courses" className="btn btn-primary">Voir tout le catalogue</Link>
    </div>
  </div>
</section>

<section className="section">
  <div className="container">
    <div className="cta-premium glass-card fade-up">
      <h2 style={{ marginBottom: '16px' }}>Vous êtes expert du négoce ou de l’export ?</h2>
      <p className="text-lead" style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
        Publiez votre formation sur Proactive Académie et transmettez votre savoir-faire à une nouvelle génération de négociants.
      </p>
      <Link href="/teach" className="btn btn-secondary">Devenir formateur</Link>
    </div>
  </div>
</section>
```
5. Keep the testimonials, values, business stats and final CTA sections unchanged.

Note: popular courses come from `'use cache'` functions with no runtime input, so they are part of the prerendered shell — no `<Suspense>` is needed, and the `fade-up` observer in `HomeEffects` sees them on mount. This means `npm run build` needs `DATABASE_URL` from here on.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run build` — Expected: green (requires `.env.local`).
`npm run start` → `/` shows 8 real courses with "Nouveau" badges (no invented ratings), links to course pages, scroll animations and counters still work, the light/dark toggle still works.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)"
git commit -m "feat(home): popular courses and counts from the catalog, become-instructor CTA"
```

---

### Task 13: Signed-in pages — learn, teach, admin, account

**Files:**
- Create: `lib/db/queries/dashboard.ts`, `lib/account/schemas.ts`, `lib/account/avatar.ts`, `app/(app)/app.module.css`, `app/(app)/learn/page.tsx`, `app/(app)/teach/page.tsx`, `app/(app)/admin/page.tsx`, `app/(app)/account/page.tsx`, `app/(app)/account/actions.ts`, `app/(app)/account/forms.tsx`
- Modify: `next.config.ts` (server action body limit)
- Test: `tests/db/dashboard.test.ts`, `lib/account/schemas.test.ts`, `lib/account/avatar.test.ts`

**Interfaces:**
- Consumes: `requireUser`, `requireRole`, `Profile` (Task 6); `listEnrolledCourses` (Task 10); `CourseGrid`, `avatarUrl`, `formatEur` (Tasks 2, 8); `COURSES_TAG` (Task 5); `createSupabaseServerClient` (Task 6).
- Produces:
  - `listInstructorCourses(db, instructorId): Promise<{ id: string; slug: string; title: string; status: CourseStatus; priceCents: number; enrollmentCount: number; updatedAt: Date }[]>`
  - `getAdminCounts(db): Promise<{ students: number; instructors: number; admins: number; courses: Record<CourseStatus, number>; enrollments: number }>`
  - `profileSchema` (displayName 2–80, headline ≤ 120, bio ≤ 2000; empty strings → null for headline/bio)
  - `AVATAR_MAX_BYTES = 2 * 1024 * 1024`, `validateAvatar(meta: { size: number; type: string }, head: Uint8Array): { ok: true; ext: 'jpg' | 'png' | 'webp'; contentType: string } | { ok: false; error: string }`
  - Actions: `updateProfileAction`, `uploadAvatarAction` — `(prev: FormState, fd: FormData) => Promise<FormState>`, `type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined> }`
  - Routes `/learn`, `/teach`, `/admin`, `/account` (all `noindex`).

- [ ] **Step 1: Failing tests**

`tests/db/dashboard.test.ts`:
```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { getAdminCounts, listInstructorCourses } from '@/lib/db/queries/dashboard';
import { enrollments, profiles } from '@/lib/db/schema';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { createTestDb, createUser } from './harness';

describe('dashboard queries', () => {
  it('lists every status of an instructor’s own courses, newest update first', async () => {
    const { client, db } = await createTestDb();
    const me = await makeInstructor(client, db);
    const other = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    await makeCourse(db, { instructorId: me, categoryId: cat.id, slug: 'a', status: 'draft', updatedAt: new Date('2026-01-01') });
    await makeCourse(db, { instructorId: me, categoryId: cat.id, slug: 'b', status: 'published', updatedAt: new Date('2026-02-01') });
    await makeCourse(db, { instructorId: other, categoryId: cat.id, slug: 'c' });
    expect((await listInstructorCourses(db, me)).map((c) => [c.slug, c.status])).toEqual([['b', 'published'], ['a', 'draft']]);
  });

  it('counts users by role, courses by status, and enrollments', async () => {
    const { client, db } = await createTestDb();
    const inst = await makeInstructor(client, db);
    const admin = await createUser(client, { email: 'admin@test.dev' });
    await db.update(profiles).set({ role: 'admin' }).where(eq(profiles.id, admin));
    const s1 = await createUser(client, { email: 's1@test.dev' });
    await createUser(client, { email: 's2@test.dev' });
    const cat = await makeCategory(db);
    const pub = await makeCourse(db, { instructorId: inst, categoryId: cat.id });
    await makeCourse(db, { instructorId: inst, categoryId: cat.id, status: 'in_review' });
    await db.insert(enrollments).values({ userId: s1, courseId: pub.id, source: 'free' });
    expect(await getAdminCounts(db)).toEqual({
      students: 2, instructors: 1, admins: 1, enrollments: 1,
      courses: { draft: 0, in_review: 1, published: 1, rejected: 0, archived: 0 },
    });
  });
});
```

`lib/account/schemas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { profileSchema } from './schemas';

describe('profileSchema', () => {
  it('trims and turns empty optional fields into null', () => {
    expect(profileSchema.parse({ displayName: '  Awa  ', headline: '  ', bio: '' })).toEqual({ displayName: 'Awa', headline: null, bio: null });
  });
  it('enforces limits', () => {
    expect(profileSchema.safeParse({ displayName: 'A', headline: '', bio: '' }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: 'Awa', headline: 'x'.repeat(121), bio: '' }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: 'Awa', headline: '', bio: 'x'.repeat(2001) }).success).toBe(false);
  });
});
```

`lib/account/avatar.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, validateAvatar } from './avatar';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const HTML = new TextEncoder().encode('<html><script>');

describe('validateAvatar', () => {
  it('accepts real png, jpeg and webp', () => {
    expect(validateAvatar({ size: 100, type: 'image/png' }, PNG)).toEqual({ ok: true, ext: 'png', contentType: 'image/png' });
    expect(validateAvatar({ size: 100, type: 'image/jpeg' }, JPG)).toMatchObject({ ok: true, ext: 'jpg' });
    expect(validateAvatar({ size: 100, type: 'image/webp' }, WEBP)).toMatchObject({ ok: true, ext: 'webp' });
  });
  it('rejects empty, oversized, wrong-type and disguised files', () => {
    expect(validateAvatar({ size: 0, type: 'image/png' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: AVATAR_MAX_BYTES + 1, type: 'image/png' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/gif' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/png' }, HTML).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/png' }, JPG).ok).toBe(false);
  });
});
```
Run: `npx vitest run tests/db/dashboard.test.ts lib/account` — Expected: FAIL.

- [ ] **Step 2: Implement**

`lib/db/queries/dashboard.ts`:
```ts
import 'server-only';
import { count, desc, eq } from 'drizzle-orm';
import { courses, enrollments, profiles, statusEnum, type CourseStatus } from '../schema';
import type { Db } from '../types';

export async function listInstructorCourses(db: Db, instructorId: string) {
  return db
    .select({
      id: courses.id, slug: courses.slug, title: courses.title, status: courses.status,
      priceCents: courses.priceCents, enrollmentCount: courses.enrollmentCount, updatedAt: courses.updatedAt,
    })
    .from(courses)
    .where(eq(courses.instructorId, instructorId))
    .orderBy(desc(courses.updatedAt));
}

export async function getAdminCounts(db: Db) {
  const [roles, statuses, [enr]] = await Promise.all([
    db.select({ role: profiles.role, n: count() }).from(profiles).groupBy(profiles.role),
    db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
    db.select({ n: count() }).from(enrollments),
  ]);
  const byRole = Object.fromEntries(roles.map((r) => [r.role, r.n]));
  const coursesByStatus = Object.fromEntries(statusEnum.enumValues.map((s) => [s, 0])) as Record<CourseStatus, number>;
  for (const s of statuses) coursesByStatus[s.status] = s.n;
  return {
    students: byRole.student ?? 0,
    instructors: byRole.instructor ?? 0,
    admins: byRole.admin ?? 0,
    courses: coursesByStatus,
    enrollments: enr.n,
  };
}
```

`lib/account/schemas.ts`:
```ts
import { z } from 'zod';

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, { error: message }).transform((s) => (s === '' ? null : s));

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Indiquez votre nom (2 caractères minimum).' }).max(80, { error: '80 caractères maximum.' }),
  headline: optionalText(120, '120 caractères maximum.'),
  bio: optionalText(2000, '2000 caractères maximum.'),
});
```

`lib/account/avatar.ts`:
```ts
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
type Ext = (typeof TYPES)[keyof typeof TYPES];

const startsWith = (head: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => head[offset + i] === b);

function matchesSignature(ext: Ext, head: Uint8Array): boolean {
  switch (ext) {
    case 'jpg': return startsWith(head, [0xff, 0xd8, 0xff]);
    case 'png': return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'webp': return startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8);
  }
}

export function validateAvatar(
  meta: { size: number; type: string },
  head: Uint8Array,
): { ok: true; ext: Ext; contentType: string } | { ok: false; error: string } {
  if (meta.size === 0) return { ok: false, error: 'Le fichier est vide.' };
  if (meta.size > AVATAR_MAX_BYTES) return { ok: false, error: 'Image trop lourde (2 Mo maximum).' };
  const ext = TYPES[meta.type as keyof typeof TYPES];
  if (!ext) return { ok: false, error: 'Formats acceptés : JPG, PNG ou WebP.' };
  if (!matchesSignature(ext, head)) return { ok: false, error: 'Le fichier n’est pas une image valide.' };
  return { ok: true, ext, contentType: meta.type };
}
```
Run: `npx vitest run tests/db/dashboard.test.ts lib/account` — Expected: PASS.

- [ ] **Step 3: Allow 2 MB uploads through Server Actions**

Read `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md` (find the exact file with `ls node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js | grep -i action`). Add the documented body-size option to `next.config.ts` with value `'3mb'` (2 MB image + multipart overhead).

- [ ] **Step 4: Account actions and forms**

`app/(app)/account/actions.ts`:
```ts
'use server';

import { eq } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { validateAvatar } from '@/lib/account/avatar';
import { profileSchema } from '@/lib/account/schemas';
import { requireUser } from '@/lib/auth/session';
import { COURSES_TAG } from '@/lib/catalog/cached';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireUser('/account');
  const parsed = profileSchema.safeParse({ displayName: fd.get('displayName') ?? '', headline: fd.get('headline') ?? '', bio: fd.get('bio') ?? '' });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  await db.update(profiles).set(parsed.data).where(eq(profiles.id, profile.id));
  updateTag(COURSES_TAG); // names appear on course cards and pages
  return { ok: true, message: 'Profil mis à jour.' };
}

export async function uploadAvatarAction(_: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireUser('/account');
  const file = fd.get('avatar');
  if (!(file instanceof File)) return { message: 'Choisissez une image.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateAvatar({ size: file.size, type: file.type }, bytes.subarray(0, 16));
  if (!check.ok) return { message: check.error };

  // Upload with the user's own session so storage policies (folder = user id) apply.
  const supabase = await createSupabaseServerClient();
  const path = `${profile.id}/avatar-${Date.now()}.${check.ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: check.contentType, upsert: false });
  if (error) return { message: 'Le téléversement a échoué. Réessayez.' };

  await db.update(profiles).set({ avatarPath: path }).where(eq(profiles.id, profile.id));
  if (profile.avatarPath) await supabase.storage.from('avatars').remove([profile.avatarPath]);
  updateTag(COURSES_TAG);
  return { ok: true, message: 'Photo mise à jour.' };
}
```

`app/(app)/account/forms.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import styles from '@/components/auth/AuthCard.module.css';
import { uploadAvatarAction, updateProfileAction, type FormState } from './actions';

const initial: FormState = {};

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? 'status' : 'alert'} className={`${styles.alert} ${state.ok ? styles.alertOk : styles.alertError}`}>
      {state.message}
    </div>
  );
}

export function ProfileForm({ displayName, headline, bio }: { displayName: string; headline: string | null; bio: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className={styles.form}>
      <Message state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="displayName">Nom affiché</label>
        <input id="displayName" name="displayName" defaultValue={displayName} required maxLength={80} className={styles.input} aria-invalid={Boolean(err('displayName'))} />
        {err('displayName') && <span className={styles.fieldError}>{err('displayName')}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="headline">Titre (ex. « Négociante en cacao depuis 15 ans »)</label>
        <input id="headline" name="headline" defaultValue={headline ?? ''} maxLength={120} className={styles.input} />
        {err('headline') && <span className={styles.fieldError}>{err('headline')}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="bio">Biographie</label>
        <textarea id="bio" name="bio" defaultValue={bio ?? ''} maxLength={2000} rows={6} className={styles.input} />
        {err('bio') && <span className={styles.fieldError}>{err('bio')}</span>}
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
  );
}

export function AvatarForm() {
  const [state, action, pending] = useActionState(uploadAvatarAction, initial);
  return (
    <form action={action} className={styles.form}>
      <Message state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="avatar">Photo de profil (JPG, PNG ou WebP, 2 Mo max.)</label>
        <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className={styles.input} />
      </div>
      <button className="btn btn-secondary" disabled={pending}>{pending ? 'Envoi…' : 'Mettre à jour la photo'}</button>
    </form>
  );
}
```

- [ ] **Step 5: Pages**

`app/(app)/app.module.css`:
```css
.page { padding: 140px 0 96px; min-height: 70vh; }
.title { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 8px; }
.lead { color: var(--text-muted); margin: 0 0 32px; }
.panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 14px; padding: clamp(20px, 4vw, 32px); }
.empty { text-align: center; display: grid; gap: 12px; justify-items: center; }
.tiles { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); }
.tile { composes: panel; }
.tileValue { font-size: 2rem; font-weight: 800; color: var(--heading); }
.tileLabel { color: var(--text-muted); font-size: 0.9rem; }
.tableWrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 560px; }
.table th, .table td { text-align: left; padding: 12px; border-bottom: 1px solid var(--border-subtle); }
.badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; background: var(--tint-gold); color: var(--on-tint-gold); }
.badgePublished { background: var(--tint-emerald); color: var(--on-tint-emerald); }
.accountGrid { display: grid; gap: 24px; }
@media (min-width: 900px) { .accountGrid { grid-template-columns: 2fr 1fr; align-items: start; } }
```

`app/(app)/learn/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { listEnrolledCourses } from '@/lib/db/queries/enrollment';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Mon apprentissage | Proactive Académie', robots: { index: false } };

async function MyCourses() {
  const profile = await requireUser('/learn');
  const courses = await listEnrolledCourses(db, profile.id);
  return (
    <>
      <h1 className={styles.title}>Bonjour {profile.displayName.split(' ')[0]}</h1>
      <p className={styles.lead}>Vos formations. Le lecteur de cours avec suivi de progression arrive très bientôt.</p>
      {courses.length ? (
        <CourseGrid courses={courses} />
      ) : (
        <div className={`${styles.panel} ${styles.empty}`}>
          <h2 style={{ margin: 0 }}>Vous n’êtes inscrit à aucune formation</h2>
          <p className="text-muted" style={{ margin: 0 }}>Parcourez le catalogue pour commencer.</p>
          <Link href="/courses" className="btn btn-primary">Découvrir les formations</Link>
        </div>
      )}
    </>
  );
}

export default function LearnPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <MyCourses />
        </Suspense>
      </div>
    </section>
  );
}
```

`app/(app)/teach/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { listInstructorCourses } from '@/lib/db/queries/dashboard';
import type { CourseStatus } from '@/lib/db/schema';
import { formatEur } from '@/lib/money/format';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Espace formateur | Proactive Académie', robots: { index: false } };

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Brouillon', in_review: 'En validation', published: 'Publié', rejected: 'Refusé', archived: 'Archivé',
};

async function TeachContent() {
  const profile = await requireUser('/teach');
  if (profile.role === 'student') {
    return (
      <div className={styles.panel} style={{ maxWidth: 760 }}>
        <h1 className={styles.title}>Devenez formateur</h1>
        <p>
          Vous maîtrisez le négoce, l’import-export, la logistique ou la finance du commerce international ? Publiez votre
          formation sur Proactive Académie et touchez des apprenants en Afrique et en Europe.
        </p>
        <p className="text-muted">
          Les candidatures en ligne ouvrent prochainement. En attendant, présentez-vous à{' '}
          <a href="mailto:info@proactive-services.com?subject=Devenir%20formateur">info@proactive-services.com</a>.
        </p>
      </div>
    );
  }
  const courses = await listInstructorCourses(db, profile.id);
  return (
    <>
      <h1 className={styles.title}>Espace formateur</h1>
      <p className={styles.lead}>La création de cours en ligne arrive dans la prochaine version.</p>
      <div className={`${styles.panel} ${styles.tableWrap}`}>
        {courses.length ? (
          <table className={styles.table}>
            <thead>
              <tr><th scope="col">Formation</th><th scope="col">Statut</th><th scope="col">Prix</th><th scope="col">Apprenants</th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.status === 'published' ? <Link href={`/courses/${c.slug}`}>{c.title}</Link> : c.title}</td>
                  <td><span className={`${styles.badge} ${c.status === 'published' ? styles.badgePublished : ''}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td>{formatEur(c.priceCents)}</td>
                  <td>{c.enrollmentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted" style={{ margin: 0 }}>Vous n’avez pas encore de formation.</p>
        )}
      </div>
    </>
  );
}

export default function TeachPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <TeachContent />
        </Suspense>
      </div>
    </section>
  );
}
```

`app/(app)/admin/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getAdminCounts } from '@/lib/db/queries/dashboard';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Administration | Proactive Académie', robots: { index: false } };

async function AdminContent() {
  await requireRole('admin', '/admin');
  const c = await getAdminCounts(db);
  const tiles: [string, number][] = [
    ['Apprenants', c.students], ['Formateurs', c.instructors], ['Inscriptions', c.enrollments],
    ['Formations publiées', c.courses.published], ['En attente de validation', c.courses.in_review], ['Brouillons', c.courses.draft],
  ];
  return (
    <>
      <h1 className={styles.title}>Administration</h1>
      <p className={styles.lead}>Vue d’ensemble de la plateforme. Gestion des utilisateurs, validation des cours et finances arrivent dans les prochaines versions.</p>
      <div className={styles.tiles}>
        {tiles.map(([label, value]) => (
          <div key={label} className={styles.tile}>
            <div className={styles.tileValue}>{value}</div>
            <div className={styles.tileLabel}>{label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <AdminContent />
        </Suspense>
      </div>
    </section>
  );
}
```

`app/(app)/account/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/session';
import { avatarUrl } from '@/lib/media';
import styles from '../app.module.css';
import { AvatarForm, ProfileForm } from './forms';

export const metadata: Metadata = { title: 'Mon compte | Proactive Académie', robots: { index: false } };

async function AccountContent() {
  const profile = await requireUser('/account');
  const avatar = avatarUrl(profile.avatarPath);
  return (
    <>
      <h1 className={styles.title}>Mon compte</h1>
      <p className={styles.lead}>Ces informations apparaissent sur votre profil public si vous êtes formateur.</p>
      <div className={styles.accountGrid}>
        <div className={styles.panel}>
          <ProfileForm displayName={profile.displayName} headline={profile.headline} bio={profile.bio} />
        </div>
        <div className={styles.panel} style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          {avatar && <Image src={avatar} alt="Votre photo de profil" width={96} height={96} style={{ borderRadius: '50%', objectFit: 'cover' }} />}
          <AvatarForm />
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <AccountContent />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run && npm run build` — Expected: green.
Manually (signed in as a student): `/learn` shows the empty state or enrolled courses; `/teach` shows the "Devenez formateur" explainer; `/admin` → 404; `/account` saves name/headline/bio (navbar initials update after reload) and uploads a PNG avatar; a renamed `.txt` → "Le fichier n’est pas une image valide."; a 3 MB image → "Image trop lourde". Promote yourself in SQL (`update profiles set role='admin' where id='…'`) → `/admin` shows tiles.

- [ ] **Step 7: Commit**

```bash
git add lib/db/queries/dashboard.ts lib/account tests/db/dashboard.test.ts "app/(app)" next.config.ts
git commit -m "feat(app): learner, instructor, admin and account pages"
```

---

### Task 14: End-to-end smoke tests, setup docs, final verification

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`, `.env.example`
- Modify: `README.md`, `docs/superpowers/specs/2026-10-05-lms-foundation-design.md` (record the deviations listed in Step 4)

**Interfaces:**
- Consumes: everything above, a seeded database, optional `E2E_EMAIL` / `E2E_PASSWORD` for an existing confirmed test account.
- Produces: `npm run test:e2e`.

- [ ] **Step 1: Playwright**

```bash
npx playwright install chromium
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

`e2e/smoke.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test';

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('home shows real popular courses', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Formations populaires/ })).toBeVisible();
  await expect(page.locator('a[href^="/courses/"]').first()).toBeVisible();
  await expect(page.getByText('(320)')).toHaveCount(0); // no invented ratings
  await noHorizontalScroll(page);
});

test('catalog search, filter and hostile input', async ({ page }) => {
  await page.goto('/courses?q=credoc');
  await expect(page.getByRole('heading', { name: /Sécurisation des Paiements/ })).toBeVisible();
  await page.goto('/courses?q=%22%26%7C!&page=abc&sort=drop');
  await expect(page.getByText(/formation/).first()).toBeVisible();
  await page.goto('/courses');
  await page.getByLabel('Catégorie').selectOption('finance');
  await expect(page).toHaveURL(/category=finance/);
  await expect(page.getByRole('heading', { name: /Sécurisation des Paiements/ })).toBeVisible();
  await noHorizontalScroll(page);
});

test('course page shows curriculum and asks anonymous users to log in', async ({ page }) => {
  await page.goto('/courses/fondements-negoce-international');
  await expect(page.getByRole('heading', { level: 1, name: /Fondements du Négoce/ })).toBeVisible();
  await expect(page.getByText('Bienvenue et objectifs de la formation')).toBeVisible();
  await page.getByText('Construire et négocier une offre').click();
  await expect(page.getByText('Négocier avec un acheteur étranger')).toBeVisible();
  await page.getByRole('link', { name: /Se connecter pour s’inscrire/ }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcourses%2Ffondements-negoce-international/);
  await noHorizontalScroll(page);
});

test('unknown course is a 404', async ({ page }) => {
  const res = await page.goto('/courses/n-existe-pas');
  expect([200, 404]).toContain(res?.status()); // streamed notFound may keep 200
  await expect(page.getByText(/introuvable|404/i).first()).toBeVisible();
});

test('protected areas redirect anonymous visitors', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test('login rejects open redirects', async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'set E2E_EMAIL / E2E_PASSWORD to run');
  await page.goto('/login?next=//evil.com');
  await page.getByLabel('Email', { exact: true }).fill(process.env.E2E_EMAIL!);
  await page.getByLabel('Mot de passe').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/localhost:3000\/learn/);
  await expect(page.getByRole('heading', { name: /Bonjour/ })).toBeVisible();
});
```

Run: `npm run build && npm run test:e2e` — Expected: all pass (the login test is skipped unless credentials are set; run it once with a confirmed test account).

- [ ] **Step 2: `.env.example` and README**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=
DIRECT_DATABASE_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# optional
SEED_HOUSE_EMAIL=academie@proactive-services.com
E2E_EMAIL=
E2E_PASSWORD=
```
`.gitignore` ignores `.env*`; add `!.env.example` so this file is committed.

Replace `README.md` with: a one-paragraph description of Proactive Académie; prerequisites (Node 20.9+, a Supabase project); setup steps (`cp .env.example .env.local`, fill values, `npm install`, `npm run db:migrate`, `npm run db:storage`, `npm run db:seed`, Supabase Auth URL configuration: Site URL + `/auth/callback` redirect, optional Google provider, SMTP via Resend); scripts table (`dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:*`); how to promote an admin (`update public.profiles set role = 'admin' where id = '<uuid>';` in the SQL editor); and a pointer to the spec and plan in `docs/superpowers/`.

- [ ] **Step 2b: Branded error boundary (spec §6)**

Read `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`, then create `app/error.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // Sentry replaces this in Phase 5
  }, [error]);
  return (
    <section className="section" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <h1>Une erreur est survenue</h1>
        <p className="text-lead">Nous n’avons pas pu afficher cette page. Réessayez dans un instant.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={reset}>Réessayer</button>
          <Link href="/" className="btn btn-secondary">Retour à l’accueil</Link>
        </div>
        {error.digest && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 24 }}>Référence : {error.digest}</p>}
      </div>
    </section>
  );
}
```
One root boundary covers every route group (they share the root layout); record that in the spec in Step 4. Include `app/error.tsx` in the Step 5 commit.

- [ ] **Step 3: Full verification**

Run, in order, and paste the outputs into the task report:
```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```
Expected: all exit 0.

- [ ] **Step 4: Record deviations in the spec**

Edit the spec so it matches what was built:
- §7 Testing: RLS policies are tested in PGlite (with stubbed `auth` schema and `anon`/`authenticated` roles); no separate hosted RLS script.
- §5 Home page: business stats (partners, countries, learners trained, satisfaction) are kept as company claims; catalogue counts appear in the "Formations populaires" intro.
- §5 Course detail: the enrolled state shows "Vous êtes inscrit" + link to `/learn` until the Phase 2 player exists.
- §5 Signed-in shells: `/teach` for students is an explainer with a contact email; the application flow is Phase 2.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e .env.example .gitignore README.md app/error.tsx docs/superpowers/specs
git commit -m "test: e2e smoke suite, setup docs, spec updated to as-built"
```
