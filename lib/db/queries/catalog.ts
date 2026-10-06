import 'server-only';
import { and, asc, count, countDistinct, desc, eq, gt, inArray, sql, type SQL } from 'drizzle-orm';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';
import { categories, courses, enrollments, lessons, profiles, sections, type Level } from '../schema';
import type { Db } from '../types';

export type CourseCardData = {
  id: string; slug: string; title: string; subtitle: string; thumbnailPath: string | null;
  priceCents: number; level: Level; ratingAvg: number | null; ratingCount: number;
  enrollmentCount: number; totalDurationSeconds: number; lessonCount: number;
  instructorId: string; instructorName: string; categorySlug: string; categoryName: string;
};

export type CourseDetail = CourseCardData & {
  description: string; outcomes: string[]; requirements: string[]; language: string;
  promoPlaybackId: string | null; updatedAt: Date;
  instructor: { id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null };
  sections: {
    id: string; title: string;
    lessons: { id: string; title: string; kind: 'video' | 'text' | 'quiz'; isPreview: boolean; durationSeconds: number }[];
  }[];
};

export type InstructorPage = {
  id: string; displayName: string; headline: string | null; bio: string | null; avatarPath: string | null;
  stats: { courses: number; students: number; ratingAvg: number | null };
  courses: CourseCardData[];
};

const cardColumns = {
  id: courses.id, slug: courses.slug, title: courses.title, subtitle: courses.subtitle,
  thumbnailPath: courses.thumbnailPath, priceCents: courses.priceCents, level: courses.level,
  ratingAvg: courses.ratingAvg, ratingCount: courses.ratingCount, enrollmentCount: courses.enrollmentCount,
  totalDurationSeconds: courses.totalDurationSeconds, lessonCount: courses.lessonCount,
  instructorId: courses.instructorId, instructorName: profiles.displayName,
  categorySlug: categories.slug, categoryName: categories.name,
};

type CardRow = Omit<CourseCardData, 'ratingAvg'> & { ratingAvg: string | null };
const toCard = (r: CardRow): CourseCardData => ({ ...r, ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg) });

const published = eq(courses.status, 'published');

function cardsQuery(db: Db) {
  return db
    .select(cardColumns)
    .from(courses)
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId));
}

export async function searchCourses(db: Db, q: CatalogQuery): Promise<{ items: CourseCardData[]; total: number }> {
  const conds: SQL[] = [published];
  const tsQuery = q.q ? sql`websearch_to_tsquery('french', ${q.q})` : null;
  if (tsQuery) conds.push(sql`${courses.search} @@ ${tsQuery}`);
  if (q.category) conds.push(eq(categories.slug, q.category));
  if (q.level) conds.push(eq(courses.level, q.level));
  if (q.price === 'free') conds.push(eq(courses.priceCents, 0));
  if (q.price === 'paid') conds.push(gt(courses.priceCents, 0));
  const where = and(...conds);

  const orderBy: SQL[] = {
    popular: [desc(courses.enrollmentCount), sql`${courses.publishedAt} desc nulls last`],
    rating: [sql`${courses.ratingAvg} desc nulls last`, desc(courses.ratingCount)],
    newest: [sql`${courses.publishedAt} desc nulls last`],
    price_asc: [asc(courses.priceCents)],
    price_desc: [desc(courses.priceCents)],
  }[q.sort];
  // With a text query, the default ordering is relevance.
  if (tsQuery && q.sort === 'popular') orderBy.unshift(sql`ts_rank(${courses.search}, ${tsQuery}) desc`);

  const [rows, [{ total }]] = await Promise.all([
    cardsQuery(db).where(where).orderBy(...orderBy, asc(courses.id)).limit(PAGE_SIZE).offset((q.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(courses)
      .innerJoin(categories, eq(categories.id, courses.categoryId))
      .where(where),
  ]);
  return { items: rows.map(toCard), total };
}

export async function listCategories(db: Db) {
  return db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.position));
}

export async function getCourseBySlug(db: Db, slug: string): Promise<CourseDetail | null> {
  const [row] = await db
    .select({
      ...cardColumns,
      description: courses.description, outcomes: courses.outcomes, requirements: courses.requirements,
      language: courses.language, promoPlaybackId: courses.promoPlaybackId, updatedAt: courses.updatedAt,
      instructorHeadline: profiles.headline, instructorBio: profiles.bio, instructorAvatar: profiles.avatarPath,
    })
    .from(courses)
    .innerJoin(profiles, eq(profiles.id, courses.instructorId))
    .innerJoin(categories, eq(categories.id, courses.categoryId))
    .where(and(published, eq(courses.slug, slug)))
    .limit(1);
  if (!row) return null;

  const secs = await db.select().from(sections).where(eq(sections.courseId, row.id)).orderBy(asc(sections.position));
  const lessonRows = secs.length
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.sectionId, secs.map((s) => s.id)))
        .orderBy(asc(lessons.position))
    : [];

  const { instructorHeadline, instructorBio, instructorAvatar, ...card } = row;
  return {
    ...toCard(card),
    description: row.description, outcomes: row.outcomes, requirements: row.requirements,
    language: row.language, promoPlaybackId: row.promoPlaybackId, updatedAt: row.updatedAt,
    instructor: { id: row.instructorId, displayName: row.instructorName, headline: instructorHeadline, bio: instructorBio, avatarPath: instructorAvatar },
    sections: secs.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: lessonRows
        .filter((l) => l.sectionId === s.id)
        .map((l) => ({ id: l.id, title: l.title, kind: l.kind, isPreview: l.isPreview, durationSeconds: l.durationSeconds })),
    })),
  };
}

export async function getInstructorPage(db: Db, id: string): Promise<InstructorPage | null> {
  const [p] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!p || p.role === 'student') return null;
  const items = (await cardsQuery(db).where(and(published, eq(courses.instructorId, id))).orderBy(desc(courses.enrollmentCount))).map(toCard);
  if (items.length === 0) return null;

  const rated = items.filter((c) => c.ratingAvg !== null && c.ratingCount > 0);
  const ratingTotal = rated.reduce((t, c) => t + c.ratingCount, 0);
  const ratingAvg = ratingTotal
    ? Math.round((rated.reduce((t, c) => t + c.ratingAvg! * c.ratingCount, 0) / ratingTotal) * 10) / 10
    : null;

  return {
    id: p.id, displayName: p.displayName, headline: p.headline, bio: p.bio, avatarPath: p.avatarPath,
    stats: { courses: items.length, students: items.reduce((t, c) => t + c.enrollmentCount, 0), ratingAvg },
    courses: items,
  };
}

export async function getPlatformStats(db: Db) {
  const [[c], [e]] = await Promise.all([
    db.select({ courses: count(), instructors: countDistinct(courses.instructorId) }).from(courses).where(published),
    db.select({ students: countDistinct(enrollments.userId) }).from(enrollments),
  ]);
  return { courses: c.courses, instructors: c.instructors, students: e.students };
}
