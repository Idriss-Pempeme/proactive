'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import styles from '@/app/(catalog)/catalog.module.css';
import { catalogHref } from '@/lib/catalog/href';
import { LEVELS, SORTS, type CatalogQuery, type Sort } from '@/lib/catalog/params';
import { LEVEL_LABELS } from '@/lib/labels';

const SORT_LABELS: Record<Sort, string> = {
  popular: 'Les plus populaires', rating: 'Les mieux notés', newest: 'Les plus récents',
  price_asc: 'Prix croissant', price_desc: 'Prix décroissant',
};

export function CatalogFilters({ query, categories }: { query: CatalogQuery; categories: { slug: string; name: string }[] }) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) as string | null)?.trim() || undefined;
    router.push(
      catalogHref(query, {
        q: val('q'),
        category: val('category'),
        level: val('level') as CatalogQuery['level'],
        price: val('price') as CatalogQuery['price'],
        sort: (val('sort') as Sort | undefined) ?? 'popular',
      }),
    );
  }

  return (
    <form
      action="/courses"
      method="get"
      role="search"
      className={`${styles.filters} ${styles.sticky}`}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === 'SELECT') apply(e.currentTarget);
      }}
    >
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="q">Rechercher</label>
        <input id="q" name="q" type="search" defaultValue={query.q} placeholder="Cacao, Incoterms, Credoc…" className={styles.search} maxLength={100} />
      </div>
      <details className={styles.toggle} open>
        <summary>Filtres et tri</summary>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="category">Catégorie</label>
            <select id="category" name="category" defaultValue={query.category ?? ''} className={styles.select}>
              <option value="">Toutes</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="level">Niveau</label>
            <select id="level" name="level" defaultValue={query.level ?? ''} className={styles.select}>
              <option value="">Tous</option>
              {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="price">Prix</label>
            <select id="price" name="price" defaultValue={query.price ?? ''} className={styles.select}>
              <option value="">Tous</option>
              <option value="free">Gratuit</option>
              <option value="paid">Payant</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="sort">Trier par</label>
            <select id="sort" name="sort" defaultValue={query.sort} className={styles.select}>
              {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Rechercher</button>
        </div>
      </details>
    </form>
  );
}
