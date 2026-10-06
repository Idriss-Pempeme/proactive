import 'server-only';
import { count, desc, eq } from 'drizzle-orm';
import { courses, enrollments, profiles, statusEnum, type CourseStatus } from '../schema';
import type { Db } from '../types';

export async function listInstructorCourses(db: Db, instructorId: string) {
  return db
    .select({
      id: courses.id, slug: courses.slug, title: courses.title, status: courses.status,
      priceCents: courses.priceCents, enrollmentCount: courses.enrollmentCount, updatedAt: courses.updatedAt,
    })
    .from(courses)
    .where(eq(courses.instructorId, instructorId))
    .orderBy(desc(courses.updatedAt));
}

export async function getAdminCounts(db: Db) {
  const [roles, statuses, [enr]] = await Promise.all([
    db.select({ role: profiles.role, n: count() }).from(profiles).groupBy(profiles.role),
    db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
    db.select({ n: count() }).from(enrollments),
  ]);
  const byRole = Object.fromEntries(roles.map((r) => [r.role, r.n]));
  const coursesByStatus = Object.fromEntries(statusEnum.enumValues.map((s) => [s, 0])) as Record<CourseStatus, number>;
  for (const s of statuses) coursesByStatus[s.status] = s.n;
  return {
    students: byRole.student ?? 0,
    instructors: byRole.instructor ?? 0,
    admins: byRole.admin ?? 0,
    courses: coursesByStatus,
    enrollments: enr.n,
  };
}
