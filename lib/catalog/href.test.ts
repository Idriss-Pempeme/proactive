import { describe, expect, it } from 'vitest';
import { catalogHref } from './href';

describe('catalogHref', () => {
  it('omits defaults', () => {
    expect(catalogHref({ sort: 'popular', page: 1 })).toBe('/courses');
  });

  it('resets page when a filter changes', () => {
    expect(catalogHref({ sort: 'popular', page: 4, q: 'cacao' }, { category: 'negoce' })).toBe('/courses?q=cacao&category=negoce');
  });

  it('keeps page when paging', () => {
    expect(catalogHref({ sort: 'rating', page: 1 }, { page: 2 })).toBe('/courses?sort=rating&page=2');
  });

  it('removes a filter when patched to undefined', () => {
    expect(catalogHref({ sort: 'popular', page: 1, level: 'beginner' }, { level: undefined })).toBe('/courses');
  });

  it('encodes user input', () => {
    expect(catalogHref({ sort: 'popular', page: 1, q: "l'export & co" })).toBe("/courses?q=l%27export+%26+co");
  });
});
