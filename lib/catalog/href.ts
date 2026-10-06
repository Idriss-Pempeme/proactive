import type { CatalogQuery } from './params';

export function catalogHref(query: CatalogQuery, patch: Partial<CatalogQuery> = {}): string {
  const merged: CatalogQuery = { ...query, ...patch };
  if (!('page' in patch)) merged.page = 1;
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.category) params.set('category', merged.category);
  if (merged.level) params.set('level', merged.level);
  if (merged.price) params.set('price', merged.price);
  if (merged.sort !== 'popular') params.set('sort', merged.sort);
  if (merged.page > 1) params.set('page', String(merged.page));
  const qs = params.toString();
  return qs ? `/courses?${qs}` : '/courses';
}
