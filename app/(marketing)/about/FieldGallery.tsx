'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './about.module.css';

const ITEMS = [
  {
    src: '/video_2026-09-29_14-16-45.mp4',
    poster: '/photo_2026-09-29_14-16-58.jpg',
    title: 'Masterclass intensive',
    desc: "Immersion dans les stratégies d'exportation avec nos experts terrain : normes qualité et circuits de distribution internationaux.",
  },
  {
    src: '/video_2026-09-29_14-16-46.mp4',
    poster: '/photo_2026-09-29_14-16-59.jpg',
    title: "Networking d'affaires",
    desc: 'Rencontres B2B entre producteurs africains, acheteurs internationaux et décideurs logistiques du réseau Proactive.',
  },
  {
    src: '/video_2026-09-29_14-16-47.mp4',
    poster: '/photo_2026-09-29_14-17-00.jpg',
    title: 'Ateliers pratiques',
    desc: 'Des cas concrets de qualification de marchandises et de sécurisation douanière.',
  },
  {
    src: '/video_2026-09-29_14-16-49.mp4',
    poster: '/photo_2026-09-29_14-17-01.jpg',
    title: 'Événements & succès',
    desc: 'Les partenariats signés et les exportations réussies de notre communauté.',
  },
];

/** Field footage: posters at rest, a muted preview on hover, the full clip in a player on click. */
export function FieldGallery() {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  function preview(v: HTMLVideoElement | null, play: boolean) {
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (play) {
      if (!v.src) v.src = v.dataset.src ?? '';
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  return (
    <>
      <ul className={`${styles.gallery} stagger-children`}>
        {ITEMS.map((item, i) => (
          <li key={item.src}>
            <button
              type="button"
              className={styles.tile}
              onClick={() => setOpen(i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && preview(e.currentTarget.querySelector('video'), true)}
              onPointerLeave={(e) => preview(e.currentTarget.querySelector('video'), false)}
            >
              <span className={styles.tileMedia}>
                <Image src={item.poster} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                <video data-src={item.src} muted loop playsInline preload="none" aria-hidden="true" />
                <span className={styles.tilePlay} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                  </svg>
                </span>
              </span>
              <span className={styles.tileTitle}>{item.title}</span>
              <span className={styles.tileDesc}>{item.desc}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="film-dialog"
        aria-label={open !== null ? ITEMS[open].title : 'Vidéo'}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
      >
        <div className="film-dialog-frame">
          {open !== null && <video src={ITEMS[open].src} controls autoPlay playsInline style={{ objectFit: 'contain' }} />}
        </div>
        <button type="button" className="film-dialog-close" onClick={() => setOpen(null)} aria-label="Fermer la vidéo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </dialog>
    </>
  );
}
