import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it.each([
    [0, '0 min'], [59, '1 min'], [45 * 60, '45 min'], [2 * 3600, '2 h'], [2 * 3600 + 5 * 60, '2 h 05 min'], [3600 + 59 * 60 + 40, '2 h'],
  ])('%i s → %s', (s, out) => expect(formatDuration(s)).toBe(out));
});
