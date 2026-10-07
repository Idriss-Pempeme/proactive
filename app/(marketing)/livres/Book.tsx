'use client';

import type { PointerEvent } from 'react';
import styles from './livres.module.css';

/** A printed jacket in 3D that turns toward the pointer. */
export function Book({ tone, genre, title, subtitle }: { tone: 'ember' | 'forest'; genre: string; title: string; subtitle: string }) {
  function turn(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--ry', `${-22 + x * 26}deg`);
    e.currentTarget.style.setProperty('--rx', `${-y * 10}deg`);
  }

  function rest(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.removeProperty('--ry');
    e.currentTarget.style.removeProperty('--rx');
  }

  return (
    <div className={styles.bookScene} onPointerMove={turn} onPointerLeave={rest}>
      <div className={`${styles.book} ${styles[`cover_${tone}`]}`} role="img" aria-label={`Couverture : ${title}`}>
        <div className={styles.cover}>
          <span className={styles.coverGenre}>{genre}</span>
          <span className={styles.coverTitle}>{title}</span>
          <span className={styles.coverRule} />
          <span className={styles.coverSub}>{subtitle}</span>
          <span className={styles.coverAuthor}>Josette Kameni</span>
        </div>
        <div className={styles.pages} aria-hidden="true" />
      </div>
      <div className={styles.bookShadow} aria-hidden="true" />
    </div>
  );
}
