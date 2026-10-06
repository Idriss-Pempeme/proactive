import { z } from 'zod';

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, { error: message }).transform((s) => (s === '' ? null : s));

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Indiquez votre nom (2 caractères minimum).' }).max(80, { error: '80 caractères maximum.' }),
  headline: optionalText(120, '120 caractères maximum.'),
  bio: optionalText(2000, '2000 caractères maximum.'),
});
