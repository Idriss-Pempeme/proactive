import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './errors';

describe('authErrorMessage', () => {
  it('translates known Supabase codes', () => {
    expect(authErrorMessage('invalid_credentials')).toBe('Email ou mot de passe incorrect.');
    expect(authErrorMessage('email_not_confirmed')).toMatch(/confirmer votre adresse/);
  });
  it('never leaks unknown codes', () => {
    expect(authErrorMessage('some_internal_thing')).toBe('Une erreur est survenue. Réessayez dans un instant.');
    expect(authErrorMessage(undefined)).toBe('Une erreur est survenue. Réessayez dans un instant.');
  });
});
