import { describe, expect, it } from 'vitest';

describe('tooling', () => {
  it('runs TypeScript tests with the @ alias', async () => {
    const mod = await import('@/tests/stubs/server-only');
    expect(mod).toBeDefined();
  });
});
