/**
 * Hosted RLS smoke test: run after `npm run db:migrate` against the real Supabase project.
 *   npm run db:rls-smoke
 * Uses the publishable key (exactly what a browser has) as anon and as a throwaway password user,
 * created and always deleted with the admin API (SUPABASE_SECRET_KEY). Exits non-zero on any FAIL.
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const publishableKey = requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const secretKey = requireEnv('SUPABASE_SECRET_KEY');

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const browserClient = () => createClient(url, publishableKey, clientOptions);

let failures = 0;
function report(name: string, ok: boolean, detail?: string) {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function check(name: string, fn: () => Promise<string | true>) {
  try {
    const result = await fn();
    report(name, result === true, result === true ? undefined : result);
  } catch (err) {
    report(name, false, err instanceof Error ? err.message : String(err));
  }
}

async function anonChecks(anon: SupabaseClient) {
  await check('anon: select lessons.body is denied', async () => {
    const { error } = await anon.from('lessons').select('body').limit(1);
    return error ? true : 'expected a permission error, got rows';
  });
  await check('anon: select profiles returns 0 rows', async () => {
    const { data, error } = await anon.from('profiles').select('id');
    if (error) return `unexpected error: ${error.message}`;
    return data.length === 0 ? true : `expected 0 rows, got ${data.length}`;
  });
  await check('anon: select public_profiles is allowed', async () => {
    const { error } = await anon.from('public_profiles').select('id, display_name').limit(5);
    return error ? `unexpected error: ${error.message}` : true;
  });
}

async function userChecks(user: SupabaseClient, userId: string, anon: SupabaseClient) {
  await check('user: profiles returns only their own row', async () => {
    const { data, error } = await user.from('profiles').select('id');
    if (error) return `unexpected error: ${error.message}`;
    return data.length === 1 && data[0].id === userId ? true : `expected [own id], got ${data.length} row(s)`;
  });
  await check('user: insert into enrollments is denied', async () => {
    const { data: course } = await anon.from('courses').select('id').limit(1).maybeSingle();
    const { error } = await user
      .from('enrollments')
      .insert({ user_id: userId, course_id: course?.id ?? randomUUID(), source: 'free' });
    return error ? true : 'expected an RLS error, the insert succeeded';
  });
  await check('user: update own role is denied', async () => {
    const { error } = await user.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (!error) return 'expected a permission error, the update succeeded';
    const { data } = await user.from('profiles').select('role').eq('id', userId).single();
    return data?.role === 'student' ? true : `role is now ${data?.role}`;
  });
  await check('user: update own avatar_path is denied', async () => {
    const { error } = await user.from('profiles').update({ avatar_path: `${userId}/x.png` }).eq('id', userId);
    return error ? true : 'expected a permission error, the update succeeded';
  });
  await check('user: update own bio is allowed', async () => {
    const bio = `rls-smoke ${new Date().toISOString()}`;
    const { data, error } = await user.from('profiles').update({ bio }).eq('id', userId).select('bio');
    if (error) return `unexpected error: ${error.message}`;
    return data.length === 1 && data[0].bio === bio ? true : `expected 1 updated row, got ${data.length}`;
  });
}

async function main() {
  const admin = createClient(url, secretKey, clientOptions);
  const anon = browserClient();
  await anonChecks(anon);

  const email = `rls-smoke-${randomUUID()}@example.com`;
  const password = `${randomUUID()}Aa1!`;
  let userId: string | undefined;
  try {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw new Error(`could not create the test user: ${created.error.message}`);
    userId = created.data.user.id;

    const user = browserClient();
    const signedIn = await user.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw new Error(`could not sign in the test user: ${signedIn.error.message}`);

    await userChecks(user, userId, anon);
    await user.auth.signOut();
  } catch (err) {
    report('user: setup', false, err instanceof Error ? err.message : String(err));
  } finally {
    if (userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      report('cleanup: test user deleted', !error, error?.message);
    }
  }

  console.log(failures === 0 ? '\nAll RLS smoke checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
