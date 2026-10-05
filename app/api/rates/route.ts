import { cacheLife } from 'next/cache';
import { fetchRates } from '@/lib/money/rates';

async function getRates() {
  'use cache';
  cacheLife({ stale: 3600, revalidate: 60 * 60 * 12, expire: 60 * 60 * 24 });
  return fetchRates();
}

export async function GET() {
  return Response.json(await getRates());
}
