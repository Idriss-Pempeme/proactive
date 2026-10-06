import { eq, sql } from 'drizzle-orm';
import { categories, courses, lessons, profiles, sections } from './schema';
import { SEED_CATEGORIES, SEED_COURSES } from './seed-data';
import type { Db } from './types';

export async function seedCatalog(db: Db, houseInstructorId: string) {
  await db
    .update(profiles)
    .set({ role: 'instructor', isHouse: true, displayName: 'Proactive Académie', headline: 'Négoce et commerce international des matières premières africaines' })
    .where(eq(profiles.id, houseInstructorId));

  for (const [i, c] of SEED_CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ slug: c.slug, name: c.name, position: i })
      .onConflictDoUpdate({ target: categories.slug, set: { name: c.name, position: i } });
  }
  const cats = new Map((await db.select().from(categories)).map((c) => [c.slug, c.id]));

  for (const course of SEED_COURSES) {
    await db.transaction(async (tx) => {
      const allLessons = course.sections.flatMap((s) => s.lessons);
      const [row] = await tx
        .insert(courses)
        .values({
          slug: course.slug,
          instructorId: houseInstructorId,
          categoryId: cats.get(course.category)!,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          outcomes: course.outcomes,
          requirements: course.requirements,
          level: course.level,
          priceCents: course.priceCents,
          thumbnailPath: course.thumbnailPath,
          status: 'published',
          publishedAt: sql`now()`,
          lessonCount: allLessons.length,
          totalDurationSeconds: allLessons.reduce((t, l) => t + l.minutes * 60, 0),
        })
        .onConflictDoNothing({ target: courses.slug })
        .returning({ id: courses.id });
      if (!row) return; // already seeded

      for (const [si, s] of course.sections.entries()) {
        const [sec] = await tx.insert(sections).values({ courseId: row.id, position: si, title: s.title }).returning();
        await tx.insert(lessons).values(
          s.lessons.map((l, li) => ({
            sectionId: sec.id,
            position: li,
            title: l.title,
            kind: 'video' as const,
            isPreview: l.preview ?? false,
            durationSeconds: l.minutes * 60,
          })),
        );
      }
    });
  }

  return { categories: SEED_CATEGORIES.length, courses: SEED_COURSES.length };
}
