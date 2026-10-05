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
