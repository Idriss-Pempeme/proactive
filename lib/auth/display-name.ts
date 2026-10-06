const MIN = 2;
const MAX = 80;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * Initial display name for a new user. Mirrors public.handle_new_user() in
 * drizzle/0001_rls_and_triggers.sql: display_name (email signup), full_name / name (Google and
 * other OAuth providers), then the email local part; anything under 2 characters becomes 'Apprenant'
 * so the profiles_display_name_len check can never fail.
 */
export function displayNameFor(metadata: Record<string, unknown> | null | undefined, email: string | null | undefined): string {
  const name =
    text(metadata?.display_name) || text(metadata?.full_name) || text(metadata?.name) || (email ?? '').split('@')[0];
  return name.length >= MIN ? name.slice(0, MAX) : 'Apprenant';
}
