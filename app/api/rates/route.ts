import { cacheLife } from 'next/cache';
import { FIXED_RATES, fetchLiveRates } from '@/lib/money/rates';

async function getRates() {
  'use cache';
  cacheLife({ stale: 3600, revalidate: 60 * 60 * 12, expire: 60 * 60 * 24 });
  return fetchLiveRates();
}

export async function GET() {
  try {
    const rates = await getRates();
    return Response.json(rates);
  } catch {
    return Response.json(FIXED_RATES, { headers: { 'Cache-Control': 'no-store' } });
  }
}
