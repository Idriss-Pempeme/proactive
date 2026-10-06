import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { listEnrolledCourses } from '@/lib/db/queries/enrollment';
import styles from '../app.module.css';

export const metadata: Metadata = { title: 'Mon apprentissage | Proactive Académie', robots: { index: false } };

async function MyCourses() {
  const profile = await requireUser('/learn');
  const courses = await listEnrolledCourses(db, profile.id);
  return (
    <>
      <h1 className={styles.title}>Bonjour {profile.displayName.split(' ')[0]}</h1>
      <p className={styles.lead}>Vos formations. Le lecteur de cours avec suivi de progression arrive très bientôt.</p>
      {courses.length ? (
        <CourseGrid courses={courses} />
      ) : (
        <div className={`${styles.panel} ${styles.empty}`}>
          <h2 style={{ margin: 0 }}>Vous n’êtes inscrit à aucune formation</h2>
          <p className="text-muted" style={{ margin: 0 }}>Parcourez le catalogue pour commencer.</p>
          <Link href="/courses" className="btn btn-primary">Découvrir les formations</Link>
        </div>
      )}
    </>
  );
}

export default function LearnPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>
          <MyCourses />
        </Suspense>
      </div>
    </section>
  );
}
