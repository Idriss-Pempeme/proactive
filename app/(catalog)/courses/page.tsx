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
    <div aria-busy="true">
      <div className={styles.skeletonBar} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }, (_, i) => <div key={i} className={styles.skeleton} />)}
      </div>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<'/courses'>['searchParams'] }) {
  const query = parseCatalogParams(await searchParams);
  const [{ items, total }, categories] = await Promise.all([cachedSearchCourses(query), cachedCategories()]);
  return (
    <>
      {/* key resets the uncontrolled inputs when the URL changes */}
      <CatalogFilters key={JSON.stringify(query)} query={query} categories={categories} total={total} />
      {items.length ? (
        <CourseGrid courses={items} />
      ) : (
        <div className={styles.empty}>
          <h2>Aucune formation ne correspond</h2>
          <p>Essayez d’autres mots-clés ou retirez des filtres.</p>
          <Link href="/courses" className={styles.emptyLink}>Voir toutes les formations</Link>
        </div>
      )}
      <Pagination query={query} total={total} />
    </>
  );
}

export default function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  return (
    <section className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <p className={styles.label}>Formations</p>
          <h1>
            Catalogue des <span>formations.</span>
          </h1>
          <p className={styles.lead}>Négoce, import-export, logistique, finance : apprenez auprès de praticiens du terrain.</p>
        </header>
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
