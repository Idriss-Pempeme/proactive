'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authErrorMessage } from '@/lib/auth/errors';
import { safeNextPath } from '@/lib/auth/roles';
import { emailOnlySchema, resetPasswordSchema, signInSchema, signUpSchema } from '@/lib/auth/schemas';
import { siteUrl } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Safe submitted values (never passwords) so the form can re-fill after an action. */
  values?: Record<string, string>;
};

const fields = (fd: FormData) => Object.fromEntries(fd) as Record<string, string>;
const pick = (fd: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, String(fd.get(n) ?? '')]));
const callbackUrl = (next: string) => `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: pick(fd, ['email']) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { message: authErrorMessage(error.code), values: pick(fd, ['email']) };
  redirect(safeNextPath(parsed.data.next));
}

export async function signUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = pick(fd, ['displayName', 'email']);
  const parsed = signUpSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  const next = safeNextPath(parsed.data.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName }, emailRedirectTo: callbackUrl(next) },
  });
  // Same answer whether or not the email is already registered (no account enumeration).
  const existing = error?.code === 'user_already_exists' || error?.code === 'email_exists';
  if (error && !existing) return { message: authErrorMessage(error.code), values };
  if (data?.session) redirect(next); // email confirmation disabled
  return { ok: true, message: 'Compte créé. Cliquez sur le lien envoyé par email pour l’activer.' };
}

export async function magicLinkAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: pick(fd, ['email']) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(safeNextPath(parsed.data.next)) },
  });
  if (error) return { message: authErrorMessage(error.code), values: pick(fd, ['email']) };
  return { ok: true, message: 'Lien de connexion envoyé. Vérifiez votre boîte mail.' };
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = emailOnlySchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: pick(fd, ['email']) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: callbackUrl('/reset-password') });
  if (error?.code?.startsWith('over_')) return { message: authErrorMessage(error.code) };
  // Same answer whether or not the account exists (no account enumeration).
  return { ok: true, message: 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.' };
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: pick(fd, []) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: authErrorMessage(error.code), values: pick(fd, []) };
  redirect('/learn');
}

export async function googleSignInAction(fd: FormData): Promise<void> {
  const next = safeNextPath(String(fd.get('next') ?? ''));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl(next) } });
  if (error || !data.url) redirect(`/login?error=oauth&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
