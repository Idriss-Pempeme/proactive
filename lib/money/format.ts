import type { DisplayCurrency } from './currencies';

const eurWithCents = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurWhole = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

export function formatEur(cents: number): string {
  if (cents === 0) return 'Gratuit';
  return cents % 100 === 0 ? eurWhole.format(cents / 100) : eurWithCents.format(cents / 100);
}

/** Indicative local price, or null when there is nothing useful to show. */
export function formatApprox(
  cents: number,
  currency: DisplayCurrency,
  rate: number | undefined,
): string | null {
  if (currency === 'EUR' || cents === 0) return null;
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return null;
  const amount = Math.round((cents / 100) * rate);
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
  return `≈ ${formatted}`;
}
