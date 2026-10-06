import type { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { courses, enrollments, profiles } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { makeCategory, makeCourse, makeInstructor, makeLesson, makeSection } from './factories';
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

describe('public_profiles view', () => {
  it('exposes only safe columns, only for instructors with a published course', async () => {
    const cat = await makeCategory(db);
    const withPublished = await makeInstructor(client, db);
    const draftOnly = await makeInstructor(client, db);
    const student = await createUser(client, { email: 'student-pp@test.dev' });
    await makeCourse(db, { instructorId: withPublished, categoryId: cat.id, status: 'published' });
    await makeCourse(db, { instructorId: draftOnly, categoryId: cat.id, status: 'draft' });
    const res = await asUser(client, null, () =>
      client.query<Record<string, unknown>>('select * from public.public_profiles where id = any($1)', [
        [withPublished, draftOnly, student],
      ]),
    );
    expect(res.rows.map((r) => r.id)).toEqual([withPublished]);
    expect(res.fields.map((f) => f.name)).toEqual(['id', 'display_name', 'avatar_path', 'headline', 'bio']);
  });
});

describe('profiles (RLS)', () => {
  it('hides profiles from anon and limits users to their own row', async () => {
    const a = await createUser(client, { email: 'own-a@test.dev' });
    await createUser(client, { email: 'own-b@test.dev' });
    const anon = await asUser(client, null, () => client.query('select id from public.profiles'));
    expect(anon.rows).toHaveLength(0);
    const own = await asUser(client, a, () => client.query<{ id: string }>('select id from public.profiles'));
    expect(own.rows.map((r) => r.id)).toEqual([a]);
  });

  it('prevents users from changing is_house', async () => {
    const id = await createUser(client, { email: 'house@test.dev' });
    await expect(
      asUser(client, id, () => client.query(`update public.profiles set is_house = true where id = $1`, [id])),
    ).rejects.toThrow(/admin-managed/);
  });
});

describe('lesson content protection', () => {
  it('lets anon read lesson metadata but not body or playback id', async () => {
    const instructorId = await makeInstructor(client, db);
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId, categoryId: cat.id, priceCents: 9900 });
    const s = await makeSection(db, c.id, 1);
    const l = await makeLesson(db, s.id, 1, { body: 'secret', muxPlaybackId: 'mux-secret' });
    const ok = await asUser(client, null, () =>
      client.query<{ title: string }>('select title from public.lessons where id = $1', [l.id]),
    );
    expect(ok.rows).toHaveLength(1);
    await expect(asUser(client, null, () => client.query('select body from public.lessons'))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asUser(client, null, () => client.query('select mux_playback_id from public.lessons')),
    ).rejects.toThrow(/permission denied/);
  });
});

describe('draft course curriculum visibility', () => {
  it('is hidden from anon and other users but visible to the owner', async () => {
    const owner = await makeInstructor(client, db);
    const other = await createUser(client, { email: 'other-draft@test.dev' });
    const cat = await makeCategory(db);
    const c = await makeCourse(db, { instructorId: owner, categoryId: cat.id, status: 'draft' });
    const s = await makeSection(db, c.id, 1);
    const l = await makeLesson(db, s.id, 1);
    const count = async (who: string | null) => {
      const r = await asUser(client, who, async () => ({
        c: await client.query('select 1 from public.courses where id = $1', [c.id]),
        s: await client.query('select 1 from public.sections where id = $1', [s.id]),
        l: await client.query('select 1 from public.lessons where id = $1', [l.id]),
      }));
      return [r.c.rows.length, r.s.rows.length, r.l.rows.length];
    };
    expect(await count(null)).toEqual([0, 0, 0]);
    expect(await count(other)).toEqual([0, 0, 0]);
    expect(await count(owner)).toEqual([1, 1, 1]);
  });
});

describe('admin powers', () => {
  it('lets an admin change roles and insert categories; others cannot insert categories', async () => {
    const admin = await createUser(client, { email: 'admin@test.dev' });
    await db.update(profiles).set({ role: 'admin' }).where(eq(profiles.id, admin));
    const target = await createUser(client, { email: 'promote-me@test.dev' });
    await asUser(client, admin, () =>
      client.query(`update public.profiles set role = 'instructor' where id = $1`, [target]),
    );
    const [p] = await db.select().from(profiles).where(eq(profiles.id, target));
    expect(p.role).toBe('instructor');
    await asUser(client, admin, () =>
      client.query(`insert into public.categories (slug, name) values ('admin-cat', 'Admin')`),
    );
    const plain = await createUser(client, { email: 'plain@test.dev' });
    await expect(
      asUser(client, plain, () =>
        client.query(`insert into public.categories (slug, name) values ('plain-cat', 'Plain')`),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});
