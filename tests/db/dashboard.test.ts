import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { getAdminCounts, listInstructorCourses } from '@/lib/db/queries/dashboard';
import { enrollments, profiles } from '@/lib/db/schema';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { createTestDb, createUser } from './harness';

describe('dashboard queries', () => {
  it('lists every status of an instructor’s own courses, newest update first', async () => {
    const { client, db } = await createTestDb();
    const me = await makeInstructor(client, db);
    const other = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    await makeCourse(db, { instructorId: me, categoryId: cat.id, slug: 'a', status: 'draft', updatedAt: new Date('2026-01-01') });
    await makeCourse(db, { instructorId: me, categoryId: cat.id, slug: 'b', status: 'published', updatedAt: new Date('2026-02-01') });
    await makeCourse(db, { instructorId: other, categoryId: cat.id, slug: 'c' });
    expect((await listInstructorCourses(db, me)).map((c) => [c.slug, c.status])).toEqual([['b', 'published'], ['a', 'draft']]);
  });

  it('counts users by role, courses by status, and enrollments', async () => {
    const { client, db } = await createTestDb();
    const inst = await makeInstructor(client, db);
    const admin = await createUser(client, { email: 'admin@test.dev' });
    await db.update(profiles).set({ role: 'admin' }).where(eq(profiles.id, admin));
    const s1 = await createUser(client, { email: 's1@test.dev' });
    await createUser(client, { email: 's2@test.dev' });
    const cat = await makeCategory(db);
    const pub = await makeCourse(db, { instructorId: inst, categoryId: cat.id });
    await makeCourse(db, { instructorId: inst, categoryId: cat.id, status: 'in_review' });
    await db.insert(enrollments).values({ userId: s1, courseId: pub.id, source: 'free' });
    expect(await getAdminCounts(db)).toEqual({
      students: 2, instructors: 1, admins: 1, enrollments: 1,
      courses: { draft: 0, in_review: 1, published: 1, rejected: 0, archived: 0 },
    });
  });
});
