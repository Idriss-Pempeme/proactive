import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { listInstructorCourses } from '@/lib/db/queries/dashboard';
import type { CourseStatus } from '@/lib/db/schema';
import { formatEur } from '@/lib/money/format';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Espace formateur | Proactive Académie', robots: { index: false } };

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Brouillon', in_review: 'En validation', published: 'Publié', rejected: 'Refusé', archived: 'Archivé',
};

async function TeachContent() {
  const profile = await requireUser('/teach');
  if (profile.role === 'student') {
    return (
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
    );
  }
  const courses = await listInstructorCourses(db, profile.id);
  return (
    <>
      <h1 className={styles.title}>Espace formateur</h1>
      <p className={styles.lead}>La création de cours en ligne arrive dans la prochaine version.</p>
      <div className={`${styles.panel} ${styles.tableWrap}`}>
        {courses.length ? (
          <table className={styles.table}>
            <thead>
              <tr><th scope="col">Formation</th><th scope="col">Statut</th><th scope="col">Prix</th><th scope="col">Apprenants</th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.status === 'published' ? <Link href={`/courses/${c.slug}`}>{c.title}</Link> : c.title}</td>
                  <td><span className={`${styles.badge} ${c.status === 'published' ? styles.badgePublished : ''}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td>{formatEur(c.priceCents)}</td>
                  <td>{c.enrollmentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted" style={{ margin: 0 }}>Vous n’avez pas encore de formation.</p>
        )}
      </div>
    </>
  );
}

export default function TeachPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <TeachContent />
        </Suspense>
      </div>
    </section>
  );
}
