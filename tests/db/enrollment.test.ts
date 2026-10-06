import type { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { enrollInFreeCourse, isEnrolled, listEnrolledCourses } from '@/lib/db/queries/enrollment';
import { courses, enrollments } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;
let free: { id: string };
let paid: { id: string };
let draft: { id: string };

beforeAll(async () => {
  ({ client, db } = await createTestDb());
  const instructorId = await makeInstructor(client, db);
  const cat = await makeCategory(db);
  free = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0 });
  paid = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 4900 });
  draft = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0, status: 'draft' });
});

const countOf = async (id: string) => (await db.select().from(courses).where(eq(courses.id, id)))[0].enrollmentCount;

describe('enrollInFreeCourse', () => {
  it('enrolls once and increments the counter once', async () => {
    const user = await createUser(client, { email: 'a@test.dev' });
    expect(await enrollInFreeCourse(db, user, free.id)).toBe('enrolled');
    expect(await enrollInFreeCourse(db, user, free.id)).toBe('already_enrolled');
    expect(await countOf(free.id)).toBe(1);
    expect(await isEnrolled(db, user, free.id)).toBe(true);
  });

  it('handles concurrent double-submits without double counting', async () => {
    const user = await createUser(client, { email: 'b@test.dev' });
    const results = await Promise.all([enrollInFreeCourse(db, user, free.id), enrollInFreeCourse(db, user, free.id)]);
    expect([...results].sort()).toEqual(['already_enrolled', 'enrolled']);
    expect(await countOf(free.id)).toBe(2);
  });

  it('refuses paid, unpublished and unknown courses', async () => {
    const user = await createUser(client, { email: 'c@test.dev' });
    expect(await enrollInFreeCourse(db, user, paid.id)).toBe('not_free');
    expect(await enrollInFreeCourse(db, user, draft.id)).toBe('not_found');
    expect(await enrollInFreeCourse(db, user, crypto.randomUUID())).toBe('not_found');
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, user))).toHaveLength(0);
    expect(await countOf(paid.id)).toBe(0);
  });

  it('lists a user’s courses newest first', async () => {
    const user = await createUser(client, { email: 'd@test.dev' });
    await db.insert(enrollments).values({ userId: user, courseId: paid.id, source: 'admin', createdAt: new Date('2026-01-01') });
    await enrollInFreeCourse(db, user, free.id);
    expect((await listEnrolledCourses(db, user)).map((c) => c.id)).toEqual([free.id, paid.id]);
    expect(await isEnrolled(db, user, draft.id)).toBe(false);
  });
});
