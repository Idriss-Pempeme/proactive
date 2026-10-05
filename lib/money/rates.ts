import { CFA_PER_EUR, DISPLAY_CURRENCIES, type DisplayCurrency } from './currencies';

export type Rates = Partial<Record<DisplayCurrency, number>>;

const RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
const FIXED: Rates = { EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR };

export function parseRates(json: unknown): Rates {
  const out: Rates = { ...FIXED };
  if (typeof json !== 'object' || json === null) return out;
  const payload = json as { result?: unknown; base_code?: unknown; rates?: unknown };
  if (payload.result !== 'success' || payload.base_code !== 'EUR') return out;
  if (typeof payload.rates !== 'object' || payload.rates === null) return out;
  const rates = payload.rates as Record<string, unknown>;
  for (const code of DISPLAY_CURRENCIES) {
    if (code in FIXED) continue;
    const value = rates[code];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[code] = value;
  }
  return out;
}

export async function fetchRates(fetchImpl: typeof fetch = fetch): Promise<Rates> {
  try {
    const res = await fetchImpl(RATES_URL);
    if (!res.ok) return parseRates(null);
    return parseRates(await res.json());
  } catch {
    return parseRates(null);
  }
}
