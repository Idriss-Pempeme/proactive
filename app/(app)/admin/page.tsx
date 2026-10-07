import type { Metadata } from 'next';
import { getPlatformStats } from '@/lib/data/catalog';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Administration | Proactive Académie', robots: { index: false } };

export default function AdminPage() {
  const stats = getPlatformStats();
  const tiles: [string, number][] = [
    ['Apprenants', stats.students], ['Formateurs', stats.instructors], ['Inscriptions', 0],
    ['Formations publiées', stats.courses], ['En attente de validation', 0], ['Brouillons', 0],
  ];
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Administration</h1>
        <p className={styles.lead}>Vue d’ensemble de la plateforme (données de démonstration).</p>
        <div className={styles.tiles}>
          {tiles.map(([label, value]) => (
            <div key={label} className={styles.tile}>
              <div className={styles.tileValue}>{value}</div>
              <div className={styles.tileLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
