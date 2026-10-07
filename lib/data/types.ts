export type Level = 'beginner' | 'intermediate' | 'advanced' | 'all';

export type CourseCardData = {
  id: string; slug: string; title: string; subtitle: string; thumbnailPath: string | null;
  priceCents: number; level: Level; ratingAvg: number | null; ratingCount: number;
  enrollmentCount: number; totalDurationSeconds: number; lessonCount: number;
  instructorId: string; instructorName: string; categorySlug: string; categoryName: string;
};

export type CourseDetail = CourseCardData & {
  description: string; outcomes: string[]; requirements: string[]; language: string; updatedAt: Date;
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

export type Category = { id: string; slug: string; name: string };
