'use server';

import { eq } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { validateAvatar } from '@/lib/account/avatar';
import { profileSchema } from '@/lib/account/schemas';
import { requireUser } from '@/lib/auth/session';
import { COURSES_TAG } from '@/lib/catalog/cached';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted text values, echoed back on validation errors so React’s form reset doesn’t wipe them. */
  values?: Record<string, string>;
};

const text = (fd: FormData, k: string) => (typeof fd.get(k) === 'string' ? (fd.get(k) as string) : '');

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireUser('/account');
  const values = { displayName: text(fd, 'displayName'), headline: text(fd, 'headline'), bio: text(fd, 'bio') };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  await db.update(profiles).set(parsed.data).where(eq(profiles.id, profile.id));
  updateTag(COURSES_TAG); // names appear on course cards and pages
  return { ok: true, message: 'Profil mis à jour.' };
}

export async function uploadAvatarAction(_: FormState, fd: FormData): Promise<FormState> {
  const profile = await requireUser('/account');
  const file = fd.get('avatar');
  if (!(file instanceof File)) return { message: 'Choisissez une image.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateAvatar({ size: file.size, type: file.type }, bytes.subarray(0, 16));
  if (!check.ok) return { message: check.error };

  // Upload with the user's own session so storage policies (folder = user id) apply.
  const supabase = await createSupabaseServerClient();
  const path = `${profile.id}/avatar-${Date.now()}.${check.ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: check.contentType, upsert: false });
  if (error) return { message: 'Le téléversement a échoué. Réessayez.' };

  try {
    await db.update(profiles).set({ avatarPath: path }).where(eq(profiles.id, profile.id));
  } catch {
    await supabase.storage.from('avatars').remove([path]); // roll back the orphaned upload
    return { message: 'Le téléversement a échoué. Réessayez.' };
  }
  if (profile.avatarPath) await supabase.storage.from('avatars').remove([profile.avatarPath]);
  updateTag(COURSES_TAG);
  return { ok: true, message: 'Photo mise à jour.' };
}
