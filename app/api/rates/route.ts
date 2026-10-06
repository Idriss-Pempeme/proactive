import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { FIXED_RATES, fetchLiveRates } from '@/lib/money/rates';

async function getRates() {
  'use cache';
  cacheLife({ stale: 3600, revalidate: 60 * 60 * 12, expire: 60 * 60 * 24 });
  return fetchLiveRates();
}

export async function GET() {
  // Request-time handler: never prerendered, so a failed build-time fetch cannot freeze the fallback.
  // getRates() stays 'use cache', so the upstream API is still hit at most every 12 h.
  await connection();
  try {
    const rates = await getRates();
    return Response.json(rates);
  } catch {
    return Response.json(FIXED_RATES, { headers: { 'Cache-Control': 'no-store' } });
  }
}
