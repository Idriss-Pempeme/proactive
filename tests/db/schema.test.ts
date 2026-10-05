import type { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { courses, enrollments, profiles } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor } from './factories';
import { asUser, createTestDb, createUser } from './harness';

let client: PGlite;
let db: Db;

beforeAll(async () => {
  ({ client, db } = await createTestDb());
});

describe('profile trigger', () => {
  it('creates a student profile using display_name metadata', async () => {
    const id = await createUser(client, { email: 'awa@test.dev', displayName: 'Awa Diallo' });
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p).toMatchObject({ displayName: 'Awa Diallo', role: 'student', isHouse: false });
  });

  it('falls back to the email local part', async () => {
    const id = await createUser(client, { email: 'kofi.mensah@test.dev' });
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p.displayName).toBe('kofi.mensah');
  });
});

describe('privilege protection', () => {
  it('lets a user edit their bio but not their role', async () => {
    const id = await createUser(client, { email: 'sneaky@test.dev' });
    await asUser(client, id, () => client.query(`update public.profiles set bio = 'Bonjour' where id = $1`, [id]));
    await expect(
      asUser(client, id, () => client.query(`update public.profiles set role = 'admin' where id = $1`, [id])),
    ).rejects.toThrow(/admin-managed/);
    const [p] = await db.select().from(profiles).where(eq(profiles.id, id));
    expect(p).toMatchObject({ bio: 'Bonjour', role: 'student' });
  });
});

describe('course visibility (RLS)', () => {
  it('shows anonymous visitors only published courses', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const pub = await makeCourse(db, { instructorId, categoryId: cat.id, status: 'published' });
    const draft = await makeCourse(db, { instructorId, categoryId: cat.id, status: 'draft' });
    const rows = await asUser(client, null, () =>
      client.query<{ id: string }>('select id from public.courses where id = any($1)', [[pub.id, draft.id]]),
    );
    expect(rows.rows.map((r) => r.id)).toEqual([pub.id]);
  });

  it('populates the full-text search vector', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId, categoryId: cat.id, title: 'Exportation du cacao' });
    const [row] = await db
      .select({ hit: sql<boolean>`${courses.search} @@ websearch_to_tsquery('french', 'exporter cacao')` })
      .from(courses)
      .where(eq(courses.id, c.id));
    expect(row.hit).toBe(true);
  });
});

describe('enrollments (RLS)', () => {
  it('cannot be inserted from the browser', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 0 });
    const student = await createUser(client, { email: 'free-rider@test.dev' });
    await expect(
      asUser(client, student, () =>
        client.query(`insert into public.enrollments (user_id, course_id, source) values ($1, $2, 'free')`, [student, c.id]),
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, student))).toHaveLength(0);
  });
});
