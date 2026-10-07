'use client';

import { setDisplayCurrency, useDisplayCurrency } from '@/components/catalog/useDisplayCurrency';
import { DISPLAY_CURRENCIES, isDisplayCurrency, type DisplayCurrency } from '@/lib/money/currencies';

const LABELS: Record<DisplayCurrency, string> = {
  EUR: 'Euro (€)', USD: 'Dollar US ($)', GBP: 'Livre sterling (£)', CHF: 'Franc suisse', CAD: 'Dollar canadien',
  XOF: 'Franc CFA (UEMOA)', XAF: 'Franc CFA (CEMAC)', MAD: 'Dirham marocain', NGN: 'Naira nigérian',
  GHS: 'Cedi ghanéen', KES: 'Shilling kényan', ZAR: 'Rand sud-africain',
};

export function CurrencySelector() {
  const { currency } = useDisplayCurrency();
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>Afficher les prix en</span>
      <select
        value={currency}
        onChange={(e) => {
          if (isDisplayCurrency(e.target.value)) setDisplayCurrency(e.target.value);
        }}
        style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 8px', minHeight: 36 }}
      >
        {DISPLAY_CURRENCIES.map((c) => <option key={c} value={c}>{LABELS[c]}</option>)}
      </select>
    </label>
  );
}
