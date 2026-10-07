import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Mon apprentissage | Proactive Académie', robots: { index: false } };

export default function LearnPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Mon apprentissage</h1>
        <p className={styles.lead}>Vos formations. Le lecteur de cours avec suivi de progression arrive très bientôt.</p>
        <div className={`${styles.panel} ${styles.empty}`}>
          <h2 style={{ margin: 0 }}>Vous n’êtes inscrit à aucune formation</h2>
          <p className="text-muted" style={{ margin: 0 }}>Parcourez le catalogue pour commencer.</p>
          <Link href="/courses" className="btn btn-primary">Découvrir les formations</Link>
        </div>
      </div>
    </section>
  );
}
