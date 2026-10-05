import { describe, expect, it } from 'vitest';
import { countryToCurrency, isDisplayCurrency } from './currencies';

describe('countryToCurrency', () => {
  it.each([
    ['BE', 'EUR'], ['fr', 'EUR'], ['US', 'USD'], ['GB', 'GBP'], ['CH', 'CHF'], ['CA', 'CAD'],
    ['CI', 'XOF'], ['SN', 'XOF'], ['CM', 'XAF'], ['GA', 'XAF'], ['MA', 'MAD'], ['NG', 'NGN'],
    ['GH', 'GHS'], ['KE', 'KES'], ['ZA', 'ZAR'], ['IN', 'USD'], ['BR', 'USD'],
  ])('%s → %s', (country, expected) => {
    expect(countryToCurrency(country)).toBe(expected);
  });

  it('falls back to EUR when the country is unknown or malformed', () => {
    expect(countryToCurrency(null)).toBe('EUR');
    expect(countryToCurrency(undefined)).toBe('EUR');
    expect(countryToCurrency('')).toBe('EUR');
    expect(countryToCurrency('XX1')).toBe('EUR');
    expect(countryToCurrency('<script>')).toBe('EUR');
  });
});

describe('isDisplayCurrency', () => {
  it('accepts supported codes only', () => {
    expect(isDisplayCurrency('USD')).toBe(true);
    expect(isDisplayCurrency('usd')).toBe(false);
    expect(isDisplayCurrency('JPY')).toBe(false);
    expect(isDisplayCurrency('<img onerror=x>')).toBe(false);
    expect(isDisplayCurrency(undefined)).toBe(false);
  });
});
