'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { CURRENCY_COOKIE, readCurrencyCookie } from '@/lib/money/cookie';
import type { DisplayCurrency } from '@/lib/money/currencies';
import { coerceRates, type Rates } from '@/lib/money/rates';

const EVENT = 'display-currency-change';
let ratesPromise: Promise<Rates> | null = null;

function loadRates(): Promise<Rates> {
  ratesPromise ??= fetch('/api/rates')
    .then((r) => (r.ok ? r.json() : null))
    .then(coerceRates)
    .catch((): Rates => ({}))
    .then((rates) => {
      if (Object.keys(rates).length === 0) ratesPromise = null;
      return rates;
    });
  return ratesPromise;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useDisplayCurrency(): { currency: DisplayCurrency; rate: number | undefined } {
  const currency = useSyncExternalStore(subscribe, () => readCurrencyCookie(document.cookie), () => 'EUR' as const);
  const [rates, setRates] = useState<Rates>({});
  useEffect(() => {
    if (currency === 'EUR') return;
    let alive = true;
    loadRates().then((r) => {
      if (alive) setRates(r);
    });
    return () => {
      alive = false;
    };
  }, [currency]);
  return { currency, rate: rates[currency] };
}

export function setDisplayCurrency(currency: DisplayCurrency) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}
