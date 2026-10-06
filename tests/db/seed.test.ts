import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { seedCatalog } from '@/lib/db/seed';
import { SEED_COURSES } from '@/lib/db/seed-data';
import { categories, courses, lessons, profiles, sections } from '@/lib/db/schema';
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

  it('brands a fresh house account on the first seed', async () => {
    const { client, db } = await createTestDb();
    const house = await createUser(client, { email: 'academie@test.dev' });
    await seedCatalog(db, house);
    const [p] = await db.select().from(profiles).where(eq(profiles.id, house));
    expect(p).toMatchObject({
      role: 'instructor',
      isHouse: true,
      displayName: 'Proactive Académie',
      headline: 'Négoce et commerce international des matières premières africaines',
    });
  });

  it('never demotes an admin house account nor overwrites its custom name on a re-seed', async () => {
    const { client, db } = await createTestDb();
    const house = await createUser(client, { email: 'academie@test.dev' });
    await seedCatalog(db, house);
    await db
      .update(profiles)
      .set({ role: 'admin', displayName: 'Équipe Proactive', headline: 'Notre équipe pédagogique' })
      .where(eq(profiles.id, house));

    await seedCatalog(db, house);

    const [p] = await db.select().from(profiles).where(eq(profiles.id, house));
    expect(p).toMatchObject({
      role: 'admin',
      isHouse: true,
      displayName: 'Équipe Proactive',
      headline: 'Notre équipe pédagogique',
    });
  });
});
