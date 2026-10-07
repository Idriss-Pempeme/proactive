import { describe, expect, it } from 'vitest';
import { resetPasswordSchema, signInSchema, signUpSchema } from './schemas';

describe('auth schemas', () => {
  it('normalises email', () => {
    expect(signInSchema.parse({ email: '  Awa@Example.COM ', password: 'x', next: '/learn' }).email).toBe('awa@example.com');
  });

  it('requires 8+ char passwords and a display name on signup', () => {
    const r = signUpSchema.safeParse({ displayName: ' ', email: 'a@b.co', password: 'short' });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['displayName', 'password']));
  });

  it('caps display name length', () => {
    expect(signUpSchema.safeParse({ displayName: 'x'.repeat(81), email: 'a@b.co', password: '12345678' }).success).toBe(false);
  });

  it('requires matching passwords on reset', () => {
    expect(resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345679' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: '12345678', confirm: '12345678' }).success).toBe(true);
  });
});

describe('signup next', () => {
  it('accepts an optional next', () => {
    expect(signUpSchema.parse({ displayName: 'Awa', email: 'a@b.co', password: '12345678', next: '/learn/x' }).next).toBe('/learn/x');
    expect(signUpSchema.safeParse({ displayName: 'Awa', email: 'a@b.co', password: '12345678' }).success).toBe(true);
  });
});
