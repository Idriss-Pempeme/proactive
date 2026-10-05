import { sql } from 'drizzle-orm';
import {
  boolean, char, check, customType, index, integer, numeric, pgEnum, pgSchema, pgTable,
  text, timestamp, unique, uuid,
} from 'drizzle-orm/pg-core';

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

export const roleEnum = pgEnum('user_role', ['student', 'instructor', 'admin']);
export const levelEnum = pgEnum('course_level', ['beginner', 'intermediate', 'advanced', 'all']);
export const statusEnum = pgEnum('course_status', ['draft', 'in_review', 'published', 'rejected', 'archived']);
export const lessonKindEnum = pgEnum('lesson_kind', ['video', 'text', 'quiz']);
export const enrollmentSourceEnum = pgEnum('enrollment_source', ['purchase', 'free', 'admin']);

export type Role = (typeof roleEnum.enumValues)[number];
export type Level = (typeof levelEnum.enumValues)[number];
export type CourseStatus = (typeof statusEnum.enumValues)[number];

// Supabase-owned table; referenced for FKs only (drizzle-kit ignores the auth schema).
const auth = pgSchema('auth');
export const authUsers = auth.table('users', { id: uuid('id').primaryKey() });

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarPath: text('avatar_path'),
  headline: text('headline'),
  bio: text('bio'),
  role: roleEnum('role').notNull().default('student'),
  isHouse: boolean('is_house').notNull().default(false),
  country: char('country', { length: 2 }),
  ...timestamps,
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
});

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    instructorId: uuid('instructor_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull().default(''),
    description: text('description').notNull().default(''),
    outcomes: text('outcomes').array().notNull().default(sql`'{}'::text[]`),
    requirements: text('requirements').array().notNull().default(sql`'{}'::text[]`),
    level: levelEnum('level').notNull().default('all'),
    language: text('language').notNull().default('fr'),
    priceCents: integer('price_cents').notNull(),
    status: statusEnum('status').notNull().default('draft'),
    thumbnailPath: text('thumbnail_path'),
    promoPlaybackId: text('promo_playback_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ratingAvg: numeric('rating_avg', { precision: 2, scale: 1 }),
    ratingCount: integer('rating_count').notNull().default(0),
    enrollmentCount: integer('enrollment_count').notNull().default(0),
    totalDurationSeconds: integer('total_duration_seconds').notNull().default(0),
    lessonCount: integer('lesson_count').notNull().default(0),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('french', coalesce(title, '')), 'A') || setweight(to_tsvector('french', coalesce(subtitle, '')), 'B') || setweight(to_tsvector('french', coalesce(description, '')), 'C')`,
    ),
    ...timestamps,
  },
  (t) => [
    check('courses_price_nonneg', sql`${t.priceCents} >= 0`),
    index('courses_search_idx').using('gin', t.search),
    index('courses_status_idx').on(t.status),
    index('courses_instructor_idx').on(t.instructorId),
  ],
);

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
  },
  (t) => [unique('sections_course_position').on(t.courseId, t.position)],
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    kind: lessonKindEnum('kind').notNull().default('video'),
    isPreview: boolean('is_preview').notNull().default(false),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    muxPlaybackId: text('mux_playback_id'),
    body: text('body'),
  },
  (t) => [unique('lessons_section_position').on(t.sectionId, t.position)],
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'restrict' }),
    source: enrollmentSourceEnum('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('enrollments_user_course').on(t.userId, t.courseId), index('enrollments_course_idx').on(t.courseId)],
);
