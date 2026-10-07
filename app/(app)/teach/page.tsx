import type { Metadata } from 'next';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Espace formateur | Proactive Académie', robots: { index: false } };

export default function TeachPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.panel} style={{ maxWidth: 760 }}>
          <h1 className={styles.title}>Devenez formateur</h1>
          <p>
            Vous maîtrisez le négoce, l’import-export, la logistique ou la finance du commerce international ? Publiez votre
            formation sur Proactive Académie et touchez des apprenants en Afrique et en Europe.
          </p>
          <p className="text-muted">
            Les candidatures en ligne ouvrent prochainement. En attendant, présentez-vous à{' '}
            <a href="mailto:info@proactive-services.com?subject=Devenir%20formateur">info@proactive-services.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
