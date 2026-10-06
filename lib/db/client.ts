import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Db } from './types';

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // prepare:false is required by Supabase's transaction pooler.
  const client = globalForDb.pgClient ?? postgres(url, { prepare: false, max: 5 });
  if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client;
  return drizzle(client, { schema });
}

let instance: Db | undefined;

// Lazy: the build imports route modules without a database, so the connection is created on
// first use and a missing DATABASE_URL fails loudly at the first query instead of at import.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
