'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/app/(catalog)/catalog.module.css';
import { catalogHref } from '@/lib/catalog/href';
import { LEVELS, SORTS, type CatalogQuery, type Sort } from '@/lib/catalog/params';
import { LEVEL_LABELS } from '@/lib/labels';

const SORT_LABELS: Record<Sort, string> = {
  popular: 'Les plus populaires', rating: 'Les mieux notés', newest: 'Les plus récents',
  price_asc: 'Prix croissant', price_desc: 'Prix décroissant',
};

type Props = { query: CatalogQuery; categories: { slug: string; name: string }[]; total: number };

/** Search, domain chips and compact selects above the grid. Every change is a URL, so results are shareable. */
export function CatalogFilters({ query, categories, total }: Props) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const fd = new FormData(form);
    const val = (k: string) => (fd.get(k) as string | null)?.trim() || undefined;
    router.push(
      catalogHref(query, {
        q: val('q'),
        level: val('level') as CatalogQuery['level'],
        price: val('price') as CatalogQuery['price'],
        sort: (val('sort') as Sort | undefined) ?? 'popular',
      }),
    );
  }

  const filtered = Boolean(query.q || query.category || query.level || query.price);

  return (
    <form
      action="/courses"
      method="get"
      role="search"
      className={styles.filters}
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === 'SELECT') apply(e.currentTarget);
      }}
    >
      {query.category && <input type="hidden" name="category" value={query.category} />}

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <label htmlFor="q" className="sr-only">Rechercher une formation</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Rechercher : cacao, Incoterms, Credoc…"
          className={styles.search}
          maxLength={100}
          enterKeyHint="search"
        />
      </div>

      <nav aria-label="Domaines" className={styles.chips}>
        <Link href={catalogHref(query, { category: undefined })} className={styles.chip} aria-current={!query.category ? 'page' : undefined}>
          Tous les domaines
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={catalogHref(query, { category: c.slug })}
            className={styles.chip}
            aria-current={query.category === c.slug ? 'page' : undefined}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className={styles.bar}>
        <p className={styles.count} aria-live="polite">
          <span>
            <strong>{total}</strong> formation{total > 1 ? 's' : ''}
            {query.q ? ` pour « ${query.q} »` : ''}
          </span>
          {filtered && (
            <Link href="/courses" className={styles.clear}>
              Effacer les filtres
            </Link>
          )}
        </p>

        <div className={styles.selects}>
          <label className="sr-only" htmlFor="level">Niveau</label>
          <select id="level" name="level" defaultValue={query.level ?? ''} className={styles.select}>
            <option value="">Tous niveaux</option>
            {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select>

          <label className="sr-only" htmlFor="price">Prix</label>
          <select id="price" name="price" defaultValue={query.price ?? ''} className={styles.select}>
            <option value="">Tous les prix</option>
            <option value="free">Gratuit</option>
            <option value="paid">Payant</option>
          </select>

          <label className="sr-only" htmlFor="sort">Trier par</label>
          <select id="sort" name="sort" defaultValue={query.sort} className={styles.select}>
            {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
    </form>
  );
}
