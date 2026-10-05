import { describe, expect, it } from 'vitest';
import { formatApprox, formatEur } from './format';

// Intl uses narrow/no-break spaces; normalise for readable assertions.
const n = (s: string | null) => (s === null ? null : s.replace(/\s/g, ' '));

describe('formatEur', () => {
  it('formats whole euros without decimals', () => expect(n(formatEur(4900))).toBe('49 €'));
  it('keeps cents when present', () => expect(n(formatEur(4999))).toBe('49,99 €'));
  it('groups thousands', () => expect(n(formatEur(120000))).toBe('1 200 €'));
  it('shows Gratuit for free', () => expect(formatEur(0)).toBe('Gratuit'));
});

describe('formatApprox', () => {
  it('converts and rounds to whole units', () => {
    expect(n(formatApprox(4900, 'USD', 1.08))).toBe('≈ 53 $US');
  });
  it('uses the CFA peg value it is given', () => {
    expect(n(formatApprox(4900, 'XOF', 655.957))).toMatch(/^≈ 32 142 /);
  });
  it('returns null for EUR, free courses, and unusable rates', () => {
    expect(formatApprox(4900, 'EUR', 1)).toBeNull();
    expect(formatApprox(0, 'USD', 1.08)).toBeNull();
    expect(formatApprox(4900, 'USD', undefined)).toBeNull();
    expect(formatApprox(4900, 'USD', Number.NaN)).toBeNull();
    expect(formatApprox(4900, 'USD', -1)).toBeNull();
  });
});
