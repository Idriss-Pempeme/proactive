import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';
import { SEED_CATEGORIES, SEED_COURSES } from './seed-data';
import type { Category, CourseCardData, CourseDetail, InstructorPage } from './types';

/**
 * Static catalogue for the UI-only build: every page reads the demo content in seed-data.ts
 * through these functions instead of a database.
 */

const HOUSE = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: 'Proactive Académie',
  headline: 'Négoce et commerce international des matières premières africaines',
  bio: null,
  avatarPath: null,
};

const UPDATED_AT = new Date('2026-09-29T00:00:00Z');

const CATEGORIES: Category[] = SEED_CATEGORIES.map((c) => ({ id: c.slug, slug: c.slug, name: c.name }));
const categoryName = new Map(CATEGORIES.map((c) => [c.slug, c.name]));

const COURSES: CourseDetail[] = SEED_COURSES.map((c) => {
  const lessons = c.sections.flatMap((s) => s.lessons);
  return {
    id: c.slug,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    thumbnailPath: c.thumbnailPath,
    priceCents: c.priceCents,
    level: c.level,
    ratingAvg: null,
    ratingCount: 0,
    enrollmentCount: 0,
    totalDurationSeconds: lessons.reduce((t, l) => t + l.minutes * 60, 0),
    lessonCount: lessons.length,
    instructorId: HOUSE.id,
    instructorName: HOUSE.displayName,
    categorySlug: c.category,
    categoryName: categoryName.get(c.category) ?? c.category,
    description: c.description,
    outcomes: c.outcomes,
    requirements: c.requirements,
    language: 'fr',
    updatedAt: UPDATED_AT,
    instructor: HOUSE,
    sections: c.sections.map((s, si) => ({
      id: `${c.slug}-s${si}`,
      title: s.title,
      lessons: s.lessons.map((l, li) => ({
        id: `${c.slug}-s${si}-l${li}`,
        title: l.title,
        kind: 'video' as const,
        isPreview: l.preview ?? false,
        durationSeconds: l.minutes * 60,
      })),
    })),
  };
});

function toCard(c: CourseDetail): CourseCardData {
  return {
    id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, thumbnailPath: c.thumbnailPath,
    priceCents: c.priceCents, level: c.level, ratingAvg: c.ratingAvg, ratingCount: c.ratingCount,
    enrollmentCount: c.enrollmentCount, totalDurationSeconds: c.totalDurationSeconds, lessonCount: c.lessonCount,
    instructorId: c.instructorId, instructorName: c.instructorName, categorySlug: c.categorySlug, categoryName: c.categoryName,
  };
}

/** Case- and accent-insensitive, so "securisation" finds "Sécurisation". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function searchCourses(q: CatalogQuery): { items: CourseCardData[]; total: number } {
  const terms = q.q ? fold(q.q).split(/\s+/).filter(Boolean) : [];
  let list = COURSES.filter((c) => {
    if (q.category && c.categorySlug !== q.category) return false;
    if (q.level && c.level !== q.level) return false;
    if (q.price === 'free' && c.priceCents !== 0) return false;
    if (q.price === 'paid' && c.priceCents === 0) return false;
    if (terms.length) {
      const haystack = fold([c.title, c.subtitle, c.description, c.categoryName, ...c.outcomes].join(' '));
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
  if (q.sort === 'price_asc') list = [...list].sort((a, b) => a.priceCents - b.priceCents);
  if (q.sort === 'price_desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents);
  if (q.sort === 'newest') list = [...list].reverse();
  const start = (q.page - 1) * PAGE_SIZE;
  return { items: list.slice(start, start + PAGE_SIZE).map(toCard), total: list.length };
}

export function listCategories(): Category[] {
  return CATEGORIES;
}

export function getCourseBySlug(slug: string): CourseDetail | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

export function getInstructorPage(id: string): InstructorPage | null {
  if (id !== HOUSE.id) return null;
  return {
    ...HOUSE,
    stats: { courses: COURSES.length, students: 0, ratingAvg: null },
    courses: COURSES.map(toCard),
  };
}

export function getPlatformStats() {
  return { courses: COURSES.length, instructors: 1, students: 0 };
}
