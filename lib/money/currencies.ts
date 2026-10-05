export const DISPLAY_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'XOF', 'XAF', 'MAD', 'NGN', 'GHS', 'KES', 'ZAR',
] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Fixed parity of the CFA francs (UEMOA and CEMAC) to the euro. */
export const CFA_PER_EUR = 655.957;

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
  'NL', 'PT', 'SK', 'SI', 'ES', 'MC', 'SM', 'VA', 'AD', 'ME', 'XK',
  // French overseas departments report their own ISO codes
  'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF',
]);
const XOF_COUNTRIES = new Set(['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']);
const XAF_COUNTRIES = new Set(['CM', 'CF', 'TD', 'CG', 'GQ', 'GA']);
const SINGLE: Record<string, DisplayCurrency> = {
  US: 'USD', GB: 'GBP', CH: 'CHF', LI: 'CHF', CA: 'CAD', MA: 'MAD',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === 'string' && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

/** Visitor country (ISO 3166-1 alpha-2) → currency shown next to EUR prices. */
export function countryToCurrency(country: string | null | undefined): DisplayCurrency {
  if (!country) return 'EUR';
  const code = country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return 'EUR';
  if (EUR_COUNTRIES.has(code)) return 'EUR';
  if (XOF_COUNTRIES.has(code)) return 'XOF';
  if (XAF_COUNTRIES.has(code)) return 'XAF';
  return SINGLE[code] ?? 'USD';
}
