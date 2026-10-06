// Migrations only: never run `drizzle-kit push` — it does not know about the hand-written RLS/triggers in
// drizzle/0001_rls_and_triggers.sql and would drop them. Never remove `authUsers` from lib/db/schema.ts.
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
