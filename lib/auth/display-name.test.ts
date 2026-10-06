import { describe, expect, it } from 'vitest';
import { displayNameFor } from './display-name';

describe('displayNameFor (mirrors the handle_new_user trigger)', () => {
  it('prefers display_name, then full_name, then name', () => {
    expect(displayNameFor({ display_name: ' Awa ', full_name: 'Awa Diallo', name: 'A D' }, 'a@x.dev')).toBe('Awa');
    expect(displayNameFor({ display_name: '  ', full_name: 'Awa Diallo', name: 'A D' }, 'a@x.dev')).toBe('Awa Diallo');
    expect(displayNameFor({ name: 'Kofi Mensah' }, 'k@x.dev')).toBe('Kofi Mensah');
  });

  it('ignores non-string metadata and falls back to the email local part', () => {
    expect(displayNameFor({ display_name: 42, full_name: null, name: { a: 1 } }, 'kofi.mensah@x.dev')).toBe('kofi.mensah');
    expect(displayNameFor(undefined, 'kofi.mensah@x.dev')).toBe('kofi.mensah');
  });

  it('uses Apprenant when nothing usable is at least 2 characters', () => {
    expect(displayNameFor({}, undefined)).toBe('Apprenant');
    expect(displayNameFor({ full_name: 'A' }, 'b@x.dev')).toBe('Apprenant');
  });
});
