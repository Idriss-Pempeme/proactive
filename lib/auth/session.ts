import 'server-only';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { profiles, type Role } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { displayNameFor } from './display-name';
import { hasRole } from './roles';

export type Profile = typeof profiles.$inferSelect;

export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) return existing;
  // Self-heal if the signup trigger did not run (e.g. user created before migrations).
  const displayName = displayNameFor(user.user_metadata, user.email);
  const [created] = await db.insert(profiles).values({ id: user.id, displayName }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1))[0] ?? null;
});

export async function requireUser(nextPath: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return profile;
}

/** Signed-in users without the role get a 404, so private areas are not advertised. */
export async function requireRole(role: Role, nextPath: string): Promise<Profile> {
  const profile = await requireUser(nextPath);
  if (!hasRole(profile.role, role)) notFound();
  return profile;
}
