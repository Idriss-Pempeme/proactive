import { describe, expect, it, vi } from 'vitest';
import { CFA_PER_EUR } from './currencies';
import { fetchRates, parseRates } from './rates';

const good = {
  result: 'success',
  base_code: 'EUR',
  rates: { EUR: 1, USD: 1.08, GBP: 0.85, NGN: 1650.5, JPY: 160, KES: 'oops', MAD: -2 },
};

describe('parseRates', () => {
  it('keeps supported, positive, numeric rates and pins CFA to the peg', () => {
    const r = parseRates(good);
    expect(r).toMatchObject({ EUR: 1, USD: 1.08, GBP: 0.85, NGN: 1650.5, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
    expect(r).not.toHaveProperty('JPY');
    expect(r).not.toHaveProperty('KES');
    expect(r).not.toHaveProperty('MAD');
  });

  it('returns only the fixed rates for malformed payloads', () => {
    for (const bad of [null, 'x', {}, { result: 'error' }, { ...good, base_code: 'USD' }, { ...good, rates: null }]) {
      expect(parseRates(bad)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
    }
  });
});

describe('fetchRates', () => {
  it('degrades to fixed rates when the network fails', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    expect(await fetchRates(failing)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
  });

  it('degrades on non-200', async () => {
    const notOk = vi.fn().mockResolvedValue(new Response('nope', { status: 503 })) as unknown as typeof fetch;
    expect(await fetchRates(notOk)).toEqual({ EUR: 1, XOF: CFA_PER_EUR, XAF: CFA_PER_EUR });
  });

  it('parses a good response', async () => {
    const ok = vi.fn().mockResolvedValue(Response.json(good)) as unknown as typeof fetch;
    expect((await fetchRates(ok)).USD).toBe(1.08);
  });
});
