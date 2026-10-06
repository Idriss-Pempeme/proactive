import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { Pagination } from '@/components/catalog/Pagination';
import { cachedCategories, cachedSearchCourses } from '@/lib/catalog/cached';
import { parseCatalogParams } from '@/lib/catalog/params';
import styles from '../catalog.module.css';

export const metadata: Metadata = {
  title: 'Catalogue des formations | Proactive Académie',
  description: 'Formations en négoce, import-export, logistique, finance et douane, par Proactive Services et des experts du commerce international.',
};

function CatalogSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true">
      <div className={styles.skeleton} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeleton} />)}
      </div>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<'/courses'>['searchParams'] }) {
  const query = parseCatalogParams(await searchParams);
  const [{ items, total }, categories] = await Promise.all([cachedSearchCourses(query), cachedCategories()]);
  return (
    <div className={styles.layout}>
      <aside aria-label="Filtres">
        {/* key resets the uncontrolled inputs when the URL changes */}
        <CatalogFilters key={JSON.stringify(query)} query={query} categories={categories} />
      </aside>
      <div>
        <div className={styles.toolbar}>
          <p className={styles.count} aria-live="polite">
            {total} formation{total > 1 ? 's' : ''}
            {query.q ? ` pour « ${query.q} »` : ''}
          </p>
        </div>
        {items.length ? (
          <CourseGrid courses={items} />
        ) : (
          <div className={styles.empty}>
            <h2 style={{ margin: 0 }}>Aucune formation ne correspond</h2>
            <p className="text-muted" style={{ margin: 0 }}>Essayez d’autres mots-clés ou retirez des filtres.</p>
            <Link href="/courses" className="btn btn-secondary">Voir toutes les formations</Link>
          </div>
        )}
        <Pagination query={query} total={total} />
      </div>
    </div>
  );
}

export default function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  return (
    <section className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <h1>
            Catalogue des <span style={{ color: 'var(--gold-main)' }}>formations</span>
          </h1>
          <p className="text-lead">Négoce, import-export, logistique, finance : apprenez auprès de praticiens.</p>
        </header>
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
