'use client';

import { useState, type ChangeEvent } from 'react';
import styles from './contact.module.css';

const SUBJECTS = ['Formation', 'Partenariat', 'Négoce', 'Presse', 'Autre'] as const;

/**
 * No backend in this build: sending opens the visitor's e-mail app with the message
 * already written and addressed, so nothing is lost and nothing is faked.
 */
export function ContactForm({ email }: { email: string }) {
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('Formation');
  const [sent, setSent] = useState(false);

  function send(form: HTMLFormElement) {
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const from = String(fd.get('email') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();
    const body = `${message}\n\n${name}\n${from}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`${subject} : ${name}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        send(e.currentTarget);
      }}
    >
      <fieldset className={styles.subjects}>
        <legend className={styles.label}>Votre demande concerne</legend>
        <div className={styles.chips}>
          {SUBJECTS.map((s) => (
            <label key={s} className={styles.chip}>
              <input
                type="radio"
                name="subject"
                value={s}
                checked={subject === s}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value as (typeof SUBJECTS)[number])}
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Nom complet</label>
          <input id="name" name="name" required maxLength={80} autoComplete="name" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={styles.input} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={3000}
          placeholder="Décrivez votre besoin : formation visée, produit, volumes, calendrier…"
          className={styles.textarea}
        />
      </div>

      <button type="submit" className={styles.submit}>
        Envoyer le message
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12H19M19 12L13 6M19 12L13 18" />
        </svg>
      </button>

      <p className={styles.note} role={sent ? 'status' : undefined}>
        {sent ? (
          <>
            Votre messagerie devrait s’ouvrir avec le message prêt à partir. Rien ne s’ouvre ? Écrivez-nous à{' '}
            <a href={`mailto:${email}`}>{email}</a>.
          </>
        ) : (
          'L’envoi ouvre votre messagerie avec le message prêt à partir.'
        )}
      </p>
    </form>
  );
}
