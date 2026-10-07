import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'Adresse email invalide.' }));
const password = z.string().min(8, { error: 'Au moins 8 caractères.' }).max(72, { error: '72 caractères maximum.' });

export const signInSchema = z.object({ email, password: z.string().min(1, { error: 'Mot de passe requis.' }), next: z.string().optional() });
export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Indiquez votre nom.' }).max(80, { error: '80 caractères maximum.' }),
  email,
  password,
  next: z.string().optional(),
});
export const emailOnlySchema = z.object({ email, next: z.string().optional() });
export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], error: 'Les mots de passe ne correspondent pas.' });
