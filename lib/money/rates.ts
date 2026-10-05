import { CFA_PER_EUR, DISPLAY_CURRENCIES, type DisplayCurrency } from './currencies';

export type Rates = Partial<Record<DisplayCurrency, number>>;

const RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
export const FIXED_RATES: Rates = { EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR };

export function parseRates(json: unknown): Rates {
  const out: Rates = { ...FIXED_RATES };
  if (typeof json !== 'object' || json === null) return out;
  const payload = json as { result?: unknown; base_code?: unknown; rates?: unknown };
  if (payload.result !== 'success' || payload.base_code !== 'EUR') return out;
  if (typeof payload.rates !== 'object' || payload.rates === null) return out;
  const rates = payload.rates as Record<string, unknown>;
  for (const code of DISPLAY_CURRENCIES) {
    if (code in FIXED_RATES) continue;
    const value = rates[code];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[code] = value;
  }
  return out;
}

export async function fetchLiveRates(fetchImpl: typeof fetch = fetch): Promise<Rates> {
  try {
    const res = await fetchImpl(RATES_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Failed to fetch rates: HTTP ${res.status}`);
    const json = await res.json();
    const rates = parseRates(json);
    // Detect malformed payload: if parseRates returns only fixed rates, the payload was invalid
    const hasLiveData = Object.keys(rates).some(key => !(key in FIXED_RATES));
    if (!hasLiveData) throw new Error('Invalid rates payload: no live currency data');
    return rates;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Unknown error fetching rates');
  }
}
