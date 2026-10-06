import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';
import { getCourseBySlug, getInstructorPage, getPlatformStats, listCategories, searchCourses } from '@/lib/db/queries/catalog';
import { courses, enrollments } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor, makeLesson, makeSection } from './factories';
import { createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;
let negoce: { id: string; slug: string };
let finance: { id: string; slug: string };
let instructorId: string;
const q = (over: Partial<CatalogQuery> = {}): CatalogQuery => ({ sort: 'popular', page: 1, ...over });

beforeAll(async () => {
  ({ client, db } = await createTestDb());
  negoce = await makeCategory(db, { slug: 'negoce', name: 'Négoce' });
  finance = await makeCategory(db, { slug: 'finance', name: 'Finance' });
  instructorId = await makeInstructor(client, db, { displayName: 'Josette Kameni' });
  await makeCourse(db, { instructorId, categoryId: negoce.id, slug: 'cacao', title: 'Exporter le cacao', priceCents: 9900, enrollmentCount: 50, ratingAvg: '4.2', ratingCount: 10, level: 'beginner' });
  await makeCourse(db, { instructorId, categoryId: negoce.id, slug: 'karite', title: 'Le beurre de karité', priceCents: 0, enrollmentCount: 5, level: 'all' });
  await makeCourse(db, { instructorId, categoryId: finance.id, slug: 'credoc', title: 'Sécuriser par crédit documentaire', priceCents: 120000, enrollmentCount: 20, ratingAvg: '4.9', ratingCount: 3, level: 'advanced' });
  await makeCourse(db, { instructorId, categoryId: finance.id, slug: 'brouillon', title: 'Brouillon cacao', status: 'draft' });
});

const slugs = (r: { items: { slug: string }[] }) => r.items.map((i) => i.slug);

describe('searchCourses', () => {
  it('lists only published courses, popular first', async () => {
    const r = await searchCourses(db, q());
    expect(slugs(r)).toEqual(['cacao', 'credoc', 'karite']);
    expect(r.total).toBe(3);
    expect(r.items[0]).toMatchObject({ instructorName: 'Josette Kameni', categoryName: 'Négoce', ratingAvg: 4.2 });
  });

  it('full-text searches in French (stemming)', async () => {
    expect(slugs(await searchCourses(db, q({ q: 'exportation cacao' })))).toEqual(['cacao']);
  });

  it.each(['"', '&|!', "l'export", 'le la les', ')(*', 'x'.repeat(100)])('survives hostile query %j', async (text) => {
    await expect(searchCourses(db, q({ q: text }))).resolves.toHaveProperty('items');
  });

  it('filters by category, level and price', async () => {
    expect(slugs(await searchCourses(db, q({ category: 'finance' })))).toEqual(['credoc']);
    expect(slugs(await searchCourses(db, q({ level: 'beginner' })))).toEqual(['cacao']);
    expect(slugs(await searchCourses(db, q({ price: 'free' })))).toEqual(['karite']);
    expect(slugs(await searchCourses(db, q({ price: 'paid', sort: 'price_asc' })))).toEqual(['cacao', 'credoc']);
    expect((await searchCourses(db, q({ category: 'unknown' }))).total).toBe(0);
  });

  it('sorts by rating (unrated last) and price', async () => {
    expect(slugs(await searchCourses(db, q({ sort: 'rating' })))).toEqual(['credoc', 'cacao', 'karite']);
    expect(slugs(await searchCourses(db, q({ sort: 'price_desc' })))).toEqual(['credoc', 'cacao', 'karite']);
  });

  it('paginates', async () => {
    const page2 = await searchCourses(db, q({ page: 2 }));
    expect(page2.items).toHaveLength(0);
    expect(page2.total).toBe(3);
    expect(PAGE_SIZE).toBe(24);
  });
});

describe('getCourseBySlug', () => {
  it('returns ordered curriculum for a published course', async () => {
    const [c] = await db.select().from(courses).where(eq(courses.slug, 'cacao'));
    const s2 = await makeSection(db, c.id, 1, 'Deuxième');
    const s1 = await makeSection(db, c.id, 0, 'Première');
    await makeLesson(db, s1.id, 1, { title: 'B' });
    await makeLesson(db, s1.id, 0, { title: 'A', isPreview: true });
    await makeLesson(db, s2.id, 0, { title: 'C' });
    const detail = await getCourseBySlug(db, 'cacao');
    expect(detail?.sections.map((s) => s.title)).toEqual(['Première', 'Deuxième']);
    expect(detail?.sections[0].lessons.map((l) => [l.title, l.isPreview])).toEqual([['A', true], ['B', false]]);
    expect(detail?.instructor.displayName).toBe('Josette Kameni');
  });

  it('hides drafts and unknown slugs', async () => {
    expect(await getCourseBySlug(db, 'brouillon')).toBeNull();
    expect(await getCourseBySlug(db, 'nope')).toBeNull();
  });
});

describe('getInstructorPage / stats / categories', () => {
  it('returns instructor stats over published courses only', async () => {
    const page = await getInstructorPage(db, instructorId);
    expect(page?.stats).toEqual({ courses: 3, students: 75, ratingAvg: 4.4 }); // (4.2*10 + 4.9*3) / 13 = 4.36 → 4.4
    expect(page?.courses).toHaveLength(3);
  });

  it('returns null for students and unknown ids', async () => {
    const student = await createUser(client, { email: 'student@test.dev' });
    expect(await getInstructorPage(db, student)).toBeNull();
    expect(await getInstructorPage(db, crypto.randomUUID())).toBeNull();
  });

  it('counts platform stats', async () => {
    const student = await createUser(client, { email: 's2@test.dev' });
    const [c] = await db.select().from(courses).where(eq(courses.slug, 'karite'));
    await db.insert(enrollments).values({ userId: student, courseId: c.id, source: 'free' });
    expect(await getPlatformStats(db)).toEqual({ courses: 3, instructors: 1, students: 1 });
  });

  it('lists categories in order', async () => {
    expect((await listCategories(db)).map((c) => c.slug)).toEqual(['negoce', 'finance']);
  });
});
