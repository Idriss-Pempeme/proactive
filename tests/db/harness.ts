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
