import { describe, expect, it } from 'vitest';
import { parseCatalogParams } from './params';

describe('parseCatalogParams', () => {
  it('returns defaults for empty input', () => {
    expect(parseCatalogParams({})).toEqual({ sort: 'popular', page: 1 });
  });

  it('parses valid values', () => {
    expect(
      parseCatalogParams({ q: '  cacao ', category: 'negoce', level: 'advanced', price: 'free', sort: 'price_asc', page: '3' }),
    ).toEqual({ q: 'cacao', category: 'negoce', level: 'advanced', price: 'free', sort: 'price_asc', page: 3 });
  });

  it('falls back to defaults for garbage instead of throwing', () => {
    expect(
      parseCatalogParams({ page: '-3', sort: 'drop table', level: 'expert', price: 'cheap', category: '../etc', q: '   ' }),
    ).toEqual({ sort: 'popular', page: 1 });
    expect(parseCatalogParams({ page: 'abc' }).page).toBe(1);
    expect(parseCatalogParams({ page: '99999' }).page).toBe(1);
    expect(parseCatalogParams({ page: '2.5' }).page).toBe(1);
  });

  it('takes the first value of repeated params', () => {
    expect(parseCatalogParams({ sort: ['rating', 'newest'], q: ['a', 'b'] })).toMatchObject({ sort: 'rating', q: 'a' });
  });

  it('truncates very long queries to 100 chars', () => {
    expect(parseCatalogParams({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
});
