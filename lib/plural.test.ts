import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('plural (French: singular for 0 and 1)', () => {
  it.each([
    [0, '0 leçon'],
    [1, '1 leçon'],
    [2, '2 leçons'],
    [12, '12 leçons'],
  ])('%i → %s', (n, out) => expect(plural(n, 'leçon', 'leçons')).toBe(out));

  it('uses the given plural form for irregular words', () => {
    expect(plural(3, 'travail', 'travaux')).toBe('3 travaux');
  });
});
