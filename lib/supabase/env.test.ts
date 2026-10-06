import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteUrl } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

function stub(env: { site?: string; vercel?: string; nodeEnv: string }) {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', env.site ?? '');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', env.vercel ?? '');
  vi.stubEnv('NODE_ENV', env.nodeEnv);
}

describe('siteUrl', () => {
  it('uses NEXT_PUBLIC_SITE_URL first, without a trailing slash', () => {
    stub({ site: 'https://academie.example.com/', vercel: 'proactive.vercel.app', nodeEnv: 'production' });
    expect(siteUrl()).toBe('https://academie.example.com');
  });

  it('falls back to the Vercel production domain over https', () => {
    stub({ vercel: 'proactive.vercel.app', nodeEnv: 'production' });
    expect(siteUrl()).toBe('https://proactive.vercel.app');
  });

  it('throws in production when no URL is configured', () => {
    stub({ nodeEnv: 'production' });
    expect(() => siteUrl()).toThrow('NEXT_PUBLIC_SITE_URL is not set');
  });

  it('uses localhost outside production', () => {
    stub({ nodeEnv: 'development' });
    expect(siteUrl()).toBe('http://localhost:3000');
  });
});
