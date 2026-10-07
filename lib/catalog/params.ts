import { z } from 'zod';
import type { Level } from '@/lib/data/types';

export const SORTS = ['popular', 'rating', 'newest', 'price_asc', 'price_desc'] as const;
export type Sort = (typeof SORTS)[number];
export const LEVELS = ['beginner', 'intermediate', 'advanced', 'all'] as const satisfies readonly Level[];
export const PAGE_SIZE = 24;
const MAX_PAGE = 1000;

export type CatalogQuery = {
  q?: string;
  category?: string;
  level?: Level;
  price?: 'free' | 'paid';
  sort: Sort;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const qSchema = z.string().transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, ' ')).pipe(z.string().trim().min(1)).transform((s) => s.slice(0, 100));
const slugSchema = z.string().regex(/^[a-z0-9-]{1,60}$/);
const pageSchema = z.coerce.number().int().min(1).max(MAX_PAGE);

export function parseCatalogParams(sp: RawParams): CatalogQuery {
  const out: CatalogQuery = { sort: 'popular', page: 1 };
  const q = qSchema.safeParse(first(sp.q));
  if (q.success) out.q = q.data;
  const category = slugSchema.safeParse(first(sp.category));
  if (category.success) out.category = category.data;
  const level = z.enum(LEVELS).safeParse(first(sp.level));
  if (level.success) out.level = level.data;
  const price = z.enum(['free', 'paid']).safeParse(first(sp.price));
  if (price.success) out.price = price.data;
  const sort = z.enum(SORTS).safeParse(first(sp.sort));
  if (sort.success) out.sort = sort.data;
  const page = pageSchema.safeParse(first(sp.page));
  if (page.success) out.page = page.data;
  return out;
}
