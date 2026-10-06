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

// Mirrors Supabase: default privileges are set BEFORE migrations, so every new table/view/function
// is granted to the browser roles and migrations then narrow with revoke/grant. Never re-grant
// after migrating: it would undo the column-level lesson protection.
const SUPABASE_DEFAULT_PRIVILEGES = `
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`;

// auth schema is created by the stubs, so it needs explicit grants (after migrate is fine).
const SUPABASE_AUTH_GRANTS = `
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`;

export async function createTestDb(): Promise<{ client: PGlite; db: Db }> {
  const client = new PGlite();
  await client.exec(SUPABASE_STUBS);
  await client.exec(SUPABASE_DEFAULT_PRIVILEGES);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: 'drizzle' });
  await client.exec(SUPABASE_AUTH_GRANTS);
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
