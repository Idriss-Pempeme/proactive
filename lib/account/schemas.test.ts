import { describe, expect, it } from 'vitest';
import { profileSchema } from './schemas';

describe('profileSchema', () => {
  it('trims and turns empty optional fields into null', () => {
    expect(profileSchema.parse({ displayName: '  Awa  ', headline: '  ', bio: '' })).toEqual({ displayName: 'Awa', headline: null, bio: null });
  });
  it('enforces limits', () => {
    expect(profileSchema.safeParse({ displayName: 'A', headline: '', bio: '' }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: 'Awa', headline: 'x'.repeat(121), bio: '' }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: 'Awa', headline: '', bio: 'x'.repeat(2001) }).success).toBe(false);
  });
});
