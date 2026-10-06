import { isDisplayCurrency, type DisplayCurrency } from './currencies';

export const CURRENCY_COOKIE = 'display_currency';

export function readCurrencyCookie(cookieHeader: string): DisplayCurrency {
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CURRENCY_COOKIE) {
      const value = rest.join('=');
      return isDisplayCurrency(value) ? value : 'EUR';
    }
  }
  return 'EUR';
}
