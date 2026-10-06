import Link from 'next/link';
import styles from '@/app/(catalog)/catalog.module.css';
import { catalogHref } from '@/lib/catalog/href';
import { PAGE_SIZE, type CatalogQuery } from '@/lib/catalog/params';

export function Pagination({ query, total }: { query: CatalogQuery; total: number }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - query.page) <= 2);
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {query.page > 1 && <Link className={styles.pageLink} href={catalogHref(query, { page: query.page - 1 })}>Précédent</Link>}
      {nums.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && p - nums[i - 1] > 1 && <span className={styles.pageLink} aria-hidden="true">…</span>}
          <Link className={styles.pageLink} href={catalogHref(query, { page: p })} aria-current={p === query.page ? 'page' : undefined}>{p}</Link>
        </span>
      ))}
      {query.page < pages && <Link className={styles.pageLink} href={catalogHref(query, { page: query.page + 1 })}>Suivant</Link>}
    </nav>
  );
}
