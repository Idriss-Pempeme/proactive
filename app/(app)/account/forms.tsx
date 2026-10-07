'use client';

import { useActionState } from 'react';
import styles from '@/components/auth/AuthCard.module.css';
import { uploadAvatarAction, updateProfileAction, type FormState } from './actions';

const initial: FormState = {};

function Message({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div role={state.ok ? 'status' : 'alert'} className={`${styles.alert} ${state.ok ? styles.alertOk : styles.alertError}`}>
      {state.message}
    </div>
  );
}

export function ProfileForm({ displayName, headline, bio }: { displayName: string; headline: string | null; bio: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const val = (k: string, fallback: string) => state.values?.[k] ?? fallback;
  // React resets uncontrolled fields after an action; a per-submission key re-applies the defaults.
  const formKey = JSON.stringify(state.values ?? null) + JSON.stringify(state.fieldErrors ?? null) + (state.ok ? 'ok' : '');
  return (
    <form action={action} className={styles.form} key={formKey}>
      <Message state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="displayName">Nom affiché</label>
        <input id="displayName" name="displayName" defaultValue={val('displayName', displayName)} required maxLength={80} className={styles.input} aria-invalid={Boolean(err('displayName'))} />
        {err('displayName') && <span className={styles.fieldError}>{err('displayName')}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="headline">Titre (ex. « Négociante en cacao depuis 15 ans »)</label>
        <input id="headline" name="headline" defaultValue={val('headline', headline ?? '')} maxLength={120} className={styles.input} />
        {err('headline') && <span className={styles.fieldError}>{err('headline')}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="bio">Biographie</label>
        <textarea id="bio" name="bio" defaultValue={val('bio', bio ?? '')} maxLength={2000} rows={6} className={styles.input} />
        {err('bio') && <span className={styles.fieldError}>{err('bio')}</span>}
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form>
  );
}

export function AvatarForm() {
  const [state, action, pending] = useActionState(uploadAvatarAction, initial);
  return (
    <form action={action} className={styles.form}>
      <Message state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="avatar">Photo de profil (JPG, PNG ou WebP, 2 Mo max.)</label>
        <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required className={styles.input} />
      </div>
      <button className="btn btn-secondary" disabled={pending}>{pending ? 'Envoi…' : 'Mettre à jour la photo'}</button>
    </form>
  );
}
