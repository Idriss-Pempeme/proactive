import {
  getCourseBySlug, getInstructorPage, getPlatformStats, listCategories, searchCourses,
} from '@/lib/data/catalog';
import type { CatalogQuery } from './params';

/** Catalogue reads used by the pages. The UI-only build serves them from static demo content. */

export async function cachedSearchCourses(query: CatalogQuery) {
  return searchCourses(query);
}

export async function cachedPopularCourses(limit = 8) {
  return searchCourses({ sort: 'popular', page: 1 }).items.slice(0, limit);
}

export async function cachedCategories() {
  return listCategories();
}

export async function cachedCourse(slug: string) {
  return getCourseBySlug(slug);
}

export async function cachedInstructor(id: string) {
  return getInstructorPage(id);
}

export async function cachedPlatformStats() {
  return getPlatformStats();
}
