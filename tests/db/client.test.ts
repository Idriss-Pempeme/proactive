import { afterEach, describe, expect, it, vi } from 'vitest';

describe('lazy db client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('imports without DATABASE_URL and fails on first use', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.resetModules();
    const mod = await import('@/lib/db/client');
    expect(() => mod.db.select).toThrow(/DATABASE_URL is not set/);
  });
});
