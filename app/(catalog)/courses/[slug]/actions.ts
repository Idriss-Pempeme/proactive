'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { enrollInFreeCourse } from '@/lib/db/queries/enrollment';

const input = z.object({ courseId: z.uuid(), slug: z.string().regex(/^[a-z0-9-]{1,120}$/) });

export async function enrollFreeAction(formData: FormData): Promise<void> {
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/courses');
  const { courseId, slug } = parsed.data;
  const profile = await requireUser(`/courses/${slug}`);
  const result = await enrollInFreeCourse(db, profile.id, courseId);
  // Only this course page's count; catalog and home counts may lag by their cacheLife('minutes').
  if (result === 'enrolled') updateTag(`course:${slug}`);
  redirect(result === 'enrolled' || result === 'already_enrolled' ? '/learn' : `/courses/${slug}`);
}
