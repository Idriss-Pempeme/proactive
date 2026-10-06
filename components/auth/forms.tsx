'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  forgotPasswordAction, googleSignInAction, magicLinkAction, resetPasswordAction, signInAction, signUpAction,
  type ActionState,
} from '@/app/(auth)/actions';
import styles from './AuthCard.module.css';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;
const initial: ActionState = {};

function Field({ id, name, label, type = 'text', autoComplete, state }: {
  id?: string; name: string; label: string; type?: string; autoComplete?: string; state: ActionState;
}) {
  const inputId = id ?? name;
  const error = state.fieldErrors?.[name]?.[0];
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId} name={name} type={type} autoComplete={autoComplete} required className={styles.input}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && <span id={`${inputId}-error`} className={styles.fieldError}>{error}</span>}
    </div>
  );
}

function Alert({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? 'status' : 'alert'} className={`${styles.alert} ${state.ok ? styles.alertOk : styles.alertError}`}>
      {state.message}
    </div>
  );
}

const useForm = (action: Action) => useActionState(action, initial);

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, formAction, pending] = useForm(signInAction);
  const [magic, magicAction, magicPending] = useForm(magicLinkAction);
  return (
    <>
      {error && <Alert state={{ message: error }} />}
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <Alert state={state} />
        <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
        <Field name="password" label="Mot de passe" type="password" autoComplete="current-password" state={state} />
        <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>{pending ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <div className={styles.divider}>ou</div>
      <form action={googleSignInAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />
        <button className={`btn btn-secondary ${styles.submit}`}>Continuer avec Google</button>
      </form>
      <details className={styles.magic}>
        <summary>Recevoir un lien de connexion par email</summary>
        <form action={magicAction} className={styles.form} style={{ marginTop: 12 }}>
          <input type="hidden" name="next" value={next} />
          <Alert state={magic} />
          <Field id="magic-email" name="email" label="Email" type="email" autoComplete="email" state={magic} />
          <button className={`btn btn-secondary ${styles.submit}`} disabled={magicPending}>Envoyer le lien</button>
        </form>
      </details>
      <div className={styles.links}>
        <Link href="/forgot-password">Mot de passe oublié ?</Link>
        <Link href={`/signup?next=${encodeURIComponent(next)}`}>Créer un compte</Link>
      </div>
    </>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useForm(signUpAction);
  if (state.ok) return <Alert state={state} />;
  return (
    <>
      <form action={formAction} className={styles.form}>
        <Alert state={state} />
        <Field name="displayName" label="Nom complet" autoComplete="name" state={state} />
        <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
        <Field name="password" label="Mot de passe (8 caractères minimum)" type="password" autoComplete="new-password" state={state} />
        <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>{pending ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <div className={styles.links}>
        <span>Déjà inscrit ?</span>
        <Link href={`/login?next=${encodeURIComponent(next)}`}>Se connecter</Link>
      </div>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useForm(forgotPasswordAction);
  if (state.ok) return <Alert state={state} />;
  return (
    <form action={formAction} className={styles.form}>
      <Alert state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
      <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>Envoyer le lien</button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useForm(resetPasswordAction);
  return (
    <form action={formAction} className={styles.form}>
      <Alert state={state} />
      <Field name="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" state={state} />
      <Field name="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" state={state} />
      <button className={`btn btn-primary ${styles.submit}`} disabled={pending}>Enregistrer</button>
    </form>
  );
}
