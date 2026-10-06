import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getAdminCounts } from '@/lib/db/queries/dashboard';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Administration | Proactive Académie', robots: { index: false } };

async function AdminContent() {
  await requireRole('admin', '/admin');
  const c = await getAdminCounts(db);
  const tiles: [string, number][] = [
    ['Apprenants', c.students], ['Formateurs', c.instructors], ['Inscriptions', c.enrollments],
    ['Formations publiées', c.courses.published], ['En attente de validation', c.courses.in_review], ['Brouillons', c.courses.draft],
  ];
  return (
    <>
      <h1 className={styles.title}>Administration</h1>
      <p className={styles.lead}>Vue d’ensemble de la plateforme. Gestion des utilisateurs, validation des cours et finances arrivent dans les prochaines versions.</p>
      <div className={styles.tiles}>
        {tiles.map(([label, value]) => (
          <div key={label} className={styles.tile}>
            <div className={styles.tileValue}>{value}</div>
            <div className={styles.tileLabel}>{label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <AdminContent />
        </Suspense>
      </div>
    </section>
  );
}
