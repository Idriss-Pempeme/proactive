import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { seedCatalog } from '@/lib/db/seed';
import { SEED_COURSES } from '@/lib/db/seed-data';
import { categories, courses, lessons, sections } from '@/lib/db/schema';
import { createTestDb, createUser } from './harness';

describe('seedCatalog', () => {
  it('seeds published courses with computed totals and is idempotent', async () => {
    const { client, db } = await createTestDb();
    const house = await createUser(client, { email: 'academie@test.dev', displayName: 'Proactive Académie' });

    expect(await seedCatalog(db, house)).toEqual({ categories: 10, courses: SEED_COURSES.length });
    await seedCatalog(db, house); // second run must not duplicate

    expect(await db.select().from(categories)).toHaveLength(10);
    const all = await db.select().from(courses);
    expect(all).toHaveLength(SEED_COURSES.length);
    expect(all.every((c) => c.status === 'published' && c.ratingCount === 0 && c.enrollmentCount === 0)).toBe(true);

    const first = all.find((c) => c.slug === SEED_COURSES[0].slug)!;
    const expectedSeconds = SEED_COURSES[0].sections.flatMap((s) => s.lessons).reduce((t, l) => t + l.minutes * 60, 0);
    expect(first.totalDurationSeconds).toBe(expectedSeconds);
    expect(first.lessonCount).toBe(9);
    const secs = await db.select().from(sections).where(eq(sections.courseId, first.id));
    expect(secs).toHaveLength(3);
    expect(await db.select().from(lessons)).toHaveLength(
      SEED_COURSES.flatMap((c) => c.sections.flatMap((s) => s.lessons)).length,
    );
  });
});
