import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db/client';
import {
  getCourseBySlug, getInstructorPage, getPlatformStats, listCategories, searchCourses,
} from '@/lib/db/queries/catalog';
import type { CatalogQuery } from './params';

/** Every public catalog read carries this tag; mutations call updateTag(COURSES_TAG). */
export const COURSES_TAG = 'courses';

export async function cachedSearchCourses(query: CatalogQuery) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG);
  return searchCourses(db, query);
}

export async function cachedPopularCourses(limit = 8) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG);
  const { items } = await searchCourses(db, { sort: 'popular', page: 1 });
  return items.slice(0, limit);
}

export async function cachedCategories() {
  'use cache';
  cacheLife('hours');
  cacheTag(COURSES_TAG);
  return listCategories(db);
}

export async function cachedCourse(slug: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG, `course:${slug}`);
  return getCourseBySlug(db, slug);
}

export async function cachedInstructor(id: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(COURSES_TAG, `instructor:${id}`);
  return getInstructorPage(db, id);
}

export async function cachedPlatformStats() {
  'use cache';
  cacheLife('hours');
  cacheTag(COURSES_TAG);
  return getPlatformStats(db);
}
