'use server';

/** UI-only build: the account forms render and submit, but nothing is saved. */

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted text values, echoed back so React’s form reset doesn’t wipe them. */
  values?: Record<string, string>;
};

const DEMO = 'Version de démonstration : les modifications ne sont pas enregistrées.';
const text = (fd: FormData, k: string) => (typeof fd.get(k) === 'string' ? (fd.get(k) as string) : '');

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  return { message: DEMO, values: { displayName: text(fd, 'displayName'), headline: text(fd, 'headline'), bio: text(fd, 'bio') } };
}

export async function uploadAvatarAction(): Promise<FormState> {
  return { message: DEMO };
}
