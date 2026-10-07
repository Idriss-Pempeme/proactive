import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './ContactForm';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact | Proactive Services - Négoce · Formation · Opportunités',
  description: 'Une question sur une formation, un partenariat ou une opération de négoce ? Contactez Proactive Services.',
};

const EMAIL = 'direction@proactiveservices.com';

const SHORTCUTS = [
  { href: '/courses', title: 'Choisir une formation', body: 'Le catalogue complet, par domaine et par niveau.' },
  { href: '/signup?next=%2Fteach', title: 'Devenir formateur', body: 'Publiez votre formation sur Proactive Académie.' },
  { href: '/livres', title: 'Commander un livre', body: 'Les ouvrages de Josette Kameni.' },
];

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <p className={styles.eyebrowLabel}>Contact</p>
          <h1>
            Parlons de <span>votre projet.</span>
          </h1>
          <p className={styles.lead}>
            Une question sur une formation, un partenariat ou une opération de négoce ? Écrivez-nous depuis ce
            formulaire ou directement par e-mail.
          </p>
        </header>

        <div className={styles.grid}>
          <aside className={styles.side}>
            <dl className={styles.details}>
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </dd>
              </div>
              <div>
                <dt>Bureau</dt>
                <dd>Abidjan, Côte d’Ivoire</dd>
              </div>
            </dl>

            <div className={styles.shortcuts}>
              <h2>Vous cherchez plutôt…</h2>
              <ul>
                {SHORTCUTS.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className={styles.shortcut}>
                      <span>
                        <strong>{s.title}</strong>
                        <span>{s.body}</span>
                      </span>
                      <Arrow />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Écrivez-nous</h2>
            <ContactForm email={EMAIL} />
          </div>
        </div>
      </div>
    </section>
  );
}
