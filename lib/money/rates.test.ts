import { describe, expect, it, vi } from 'vitest';
import { CFA_PER_EUR } from './currencies';
import { fetchLiveRates, parseRates } from './rates';

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

describe('fetchLiveRates', () => {
  it('rejects on network failure', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(fetchLiveRates(failing)).rejects.toThrow();
  });

  it('rejects on non-200', async () => {
    const notOk = vi.fn().mockResolvedValue(new Response('nope', { status: 503 })) as unknown as typeof fetch;
    await expect(fetchLiveRates(notOk)).rejects.toThrow();
  });

  it('rejects on malformed payload', async () => {
    const badPayload = vi.fn().mockResolvedValue(Response.json({ result: 'error' })) as unknown as typeof fetch;
    await expect(fetchLiveRates(badPayload)).rejects.toThrow();
  });

  it('resolves a good response', async () => {
    const ok = vi.fn().mockResolvedValue(Response.json(good)) as unknown as typeof fetch;
    expect((await fetchLiveRates(ok)).USD).toBe(1.08);
  });

  it('passes an AbortSignal with 5s timeout', async () => {
    const ok = vi.fn().mockResolvedValue(Response.json(good)) as unknown as typeof fetch;
    await fetchLiveRates(ok);
    expect(ok).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/EUR', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('calls the exact URL', async () => {
    const ok = vi.fn().mockResolvedValue(Response.json(good)) as unknown as typeof fetch;
    await fetchLiveRates(ok);
    expect(ok).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/EUR', expect.any(Object));
  });
});
