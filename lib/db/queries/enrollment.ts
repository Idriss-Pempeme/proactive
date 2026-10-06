import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { categories, courses, enrollments, profiles } from '../schema';
import type { Db } from '../types';
import type { CourseCardData } from './catalog';

export type EnrollResult = 'enrolled' | 'already_enrolled' | 'not_found' | 'not_free';

export async function enrollInFreeCourse(db: Db, userId: string, courseId: string): Promise<EnrollResult> {
  return db.transaction(async (tx) => {
    const [course] = await tx
      .select({ priceCents: courses.priceCents })
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.status, 'published')))
      .limit(1);
    if (!course) return 'not_found';
    if (course.priceCents > 0) return 'not_free';

    // The unique (user_id, course_id) constraint makes double submits safe.
    const inserted = await tx
      .insert(enrollments)
      .values({ userId, courseId, source: 'free' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
      .returning({ id: enrollments.id });
    if (inserted.length === 0) return 'already_enrolled';

    await tx.update(courses).set({ enrollmentCount: sql`${courses.enrollmentCount} + 1` }).where(eq(courses.id, courseId));
    return 'enrolled';
  });
}

export async function isEnrolled(db: Db, userId: string, courseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return Boolean(row);
}

export async function listEnrolledCourses(db: Db, userId: string): Promise<CourseCardData[]> {
  const rows = await db
    .select({
      id: courses.id, slug: courses.slug, title: courses.title, subtitle: courses.subtitle,
      thumbnailPath: courses.thumbnailPath, priceCents: courses.priceCents, level: courses.level,
      ratingAvg: courses.ratingAvg, ratingCount: courses.ratingCount, enrollmentCount: courses.enrollmentCount,
      totalDurationSeconds: courses.totalDurationSeconds, lessonCount: courses.lessonCount,
      instructorId: courses.instructorId, instructorName: profiles.displayName,
      categorySlug: categories.slug, categoryName: categories.name,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.createdAt));
  return rows.map((r) => ({ ...r, ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg) }));
}
