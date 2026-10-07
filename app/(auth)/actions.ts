'use server';

import { z } from 'zod';
import { emailOnlySchema, resetPasswordSchema, signInSchema, signUpSchema } from '@/lib/auth/schemas';

/**
 * UI-only build: the forms validate their fields exactly as they will in production, then
 * explain that accounts are not connected yet. No data leaves the browser session.
 */

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Safe submitted values (never passwords) so the form can re-fill after an action. */
  values?: Record<string, string>;
};

const DEMO = 'Version de démonstration : les comptes ne sont pas encore activés sur ce site.';

const fields = (fd: FormData) => Object.fromEntries(fd) as Record<string, string>;
const pick = (fd: FormData, names: string[]) => Object.fromEntries(names.map((n) => [n, String(fd.get(n) ?? '')]));

function check(schema: z.ZodType, fd: FormData, keep: string[]): ActionState {
  const parsed = schema.safeParse(fields(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: pick(fd, keep) };
  return { message: DEMO, values: pick(fd, keep) };
}

export async function signInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return check(signInSchema, fd, ['email']);
}

export async function signUpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return check(signUpSchema, fd, ['displayName', 'email']);
}

export async function magicLinkAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return check(emailOnlySchema, fd, ['email']);
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return check(emailOnlySchema, fd, ['email']);
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return check(resetPasswordSchema, fd, []);
}

export async function googleSignInAction(): Promise<void> {
  // No identity provider in the UI-only build.
}
