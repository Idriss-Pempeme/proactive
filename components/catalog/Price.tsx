'use client';

import { formatApprox, formatEur } from '@/lib/money/format';
import styles from './Price.module.css';
import { useDisplayCurrency } from './useDisplayCurrency';

export function Price({ cents, size = 'md' }: { cents: number; size?: 'md' | 'lg' }) {
  const { currency, rate } = useDisplayCurrency();
  const approx = formatApprox(cents, currency, rate);
  return (
    <span className={`${styles.price} ${size === 'lg' ? styles.lg : ''}`}>
      <span className={styles.eur}>{formatEur(cents)}</span>
      {approx && (
        <span className={styles.approx} title="Montant indicatif. Le paiement est effectué en euros.">
          {approx}
        </span>
      )}
    </span>
  );
}
