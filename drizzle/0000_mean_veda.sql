CREATE TYPE "public"."enrollment_source" AS ENUM('purchase', 'free', 'admin');--> statement-breakpoint
CREATE TYPE "public"."lesson_kind" AS ENUM('video', 'text', 'quiz');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('beginner', 'intermediate', 'advanced', 'all');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'instructor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'in_review', 'published', 'rejected', 'archived');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"instructor_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"outcomes" text[] DEFAULT '{}'::text[] NOT NULL,
	"requirements" text[] DEFAULT '{}'::text[] NOT NULL,
	"level" "course_level" DEFAULT 'all' NOT NULL,
	"language" text DEFAULT 'fr' NOT NULL,
	"price_cents" integer NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"thumbnail_path" text,
	"promo_playback_id" text,
	"published_at" timestamp with time zone,
	"rating_avg" numeric(2, 1),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"total_duration_seconds" integer DEFAULT 0 NOT NULL,
	"lesson_count" integer DEFAULT 0 NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('french', coalesce(title, '')), 'A') || setweight(to_tsvector('french', coalesce(subtitle, '')), 'B') || setweight(to_tsvector('french', coalesce(description, '')), 'C')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "courses_price_nonneg" CHECK ("courses"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"source" "enrollment_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_user_course" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"kind" "lesson_kind" DEFAULT 'video' NOT NULL,
	"is_preview" boolean DEFAULT false NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"mux_playback_id" text,
	"body" text,
	CONSTRAINT "lessons_section_position" UNIQUE("section_id","position")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_path" text,
	"headline" text,
	"bio" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"is_house" boolean DEFAULT false NOT NULL,
	"country" char(2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "sections_course_position" UNIQUE("course_id","position")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "courses_search_idx" ON "courses" USING gin ("search");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_instructor_idx" ON "courses" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");