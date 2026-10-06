import { describe, expect, it } from 'vitest';
import { readCurrencyCookie } from './cookie';

describe('readCurrencyCookie', () => {
  it('reads a valid currency', () => expect(readCurrencyCookie('a=1; display_currency=XOF; b=2')).toBe('XOF'));
  it('ignores tampered or missing values', () => {
    expect(readCurrencyCookie('display_currency=%3Cscript%3E')).toBe('EUR');
    expect(readCurrencyCookie('display_currency=JPY')).toBe('EUR');
    expect(readCurrencyCookie('')).toBe('EUR');
    expect(readCurrencyCookie('my_display_currency=USD')).toBe('EUR');
  });
});
