export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set');
  return { url, key };
}

/**
 * Absolute origin used for auth redirects and metadataBase. Order: NEXT_PUBLIC_SITE_URL, then the
 * Vercel production domain; production without either fails loudly instead of emailing localhost links.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  let url: string;
  if (explicit) url = explicit;
  else if (vercel) url = `https://${vercel}`;
  else if (process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_SITE_URL is not set');
  else url = 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}
