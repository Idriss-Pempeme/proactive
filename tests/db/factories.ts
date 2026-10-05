import type { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { categories, courses, lessons, profiles, sections } from '@/lib/db/schema';
import type { Db } from '@/lib/db/types';
import { createUser } from './harness';

let seq = 0;
const next = () => ++seq;

export async function makeCategory(db: Db, over: Partial<typeof categories.$inferInsert> = {}) {
  const n = next();
  const [row] = await db.insert(categories).values({ slug: `cat-${n}`, name: `Catégorie ${n}`, position: n, ...over }).returning();
  return row;
}

export async function makeInstructor(
  client: PGlite,
  db: Db,
  over: { displayName?: string; role?: 'instructor' | 'admin'; isHouse?: boolean } = {},
) {
  const n = next();
  const id = await createUser(client, { email: `instructor${n}@test.dev`, displayName: over.displayName ?? `Formateur ${n}` });
  await db.update(profiles).set({ role: over.role ?? 'instructor', isHouse: over.isHouse ?? false }).where(eq(profiles.id, id));
  return id;
}

export async function makeCourse(
  db: Db,
  input: { instructorId: string; categoryId: string } & Partial<typeof courses.$inferInsert>,
) {
  const n = next();
  const [row] = await db
    .insert(courses)
    .values({
      slug: `cours-${n}`,
      title: `Cours ${n}`,
      priceCents: 4900,
      status: 'published',
      publishedAt: new Date(Date.UTC(2026, 0, n)),
      ...input,
    })
    .returning();
  return row;
}

export async function makeSection(db: Db, courseId: string, position: number, title = `Section ${position}`) {
  const [row] = await db.insert(sections).values({ courseId, position, title }).returning();
  return row;
}

export async function makeLesson(
  db: Db,
  sectionId: string,
  position: number,
  over: Partial<typeof lessons.$inferInsert> = {},
) {
  const [row] = await db
    .insert(lessons)
    .values({ sectionId, position, title: `Leçon ${position}`, durationSeconds: 300, ...over })
    .returning();
  return row;
}
