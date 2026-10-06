'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { COURSES_TAG } from '@/lib/catalog/cached';
import { db } from '@/lib/db/client';
import { enrollInFreeCourse } from '@/lib/db/queries/enrollment';

const input = z.object({ courseId: z.uuid(), slug: z.string().regex(/^[a-z0-9-]{1,120}$/) });

export async function enrollFreeAction(formData: FormData): Promise<void> {
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/courses');
  const { courseId, slug } = parsed.data;
  const profile = await requireUser(`/courses/${slug}`);
  const result = await enrollInFreeCourse(db, profile.id, courseId);
  if (result === 'enrolled') updateTag(COURSES_TAG);
  redirect(result === 'enrolled' || result === 'already_enrolled' ? '/learn' : `/courses/${slug}`);
}
