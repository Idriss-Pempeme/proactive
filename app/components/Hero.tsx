'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NavOnMedia } from './NavOnMedia';

const FREE_COURSE_VIDEO =
  'https://d1yei2z3i6k35z.cloudfront.net/10007092/673c509a59aee_FORMATIONGRATUITEJOSETTEKAMENIOK.mp4';

// Trade-fair footage, played in turn behind the hero.
const CLIPS = [
  '/video_2026-09-29_14-16-45.mp4',
  '/video_2026-09-29_14-16-46.mp4',
  '/video_2026-09-29_14-16-39.mp4',
];

const STATS = [
  { value: 150, suffix: '+', label: 'Partenaires mondiaux' },
  { value: 25, suffix: '', label: "Pays d'opération" },
  { value: 500, suffix: '+', label: 'Apprenants formés' },
  { value: 98, suffix: '%', label: 'Taux de satisfaction' },
];

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** Motion is opt-out: reduced-motion and data-saver visitors get the still frame and static copy. */
function motionAllowed() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !saveData;
}

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

export default function Hero() {
  // Server snapshot is "no motion", so the first paint is the still frame and static headline.
  const motionOk = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const [clip, setClip] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [filmOpen, setFilmOpen] = useState(false);
  const clipRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const animate = motionOk && playing && !filmOpen;
  const next = (clip + 1) % CLIPS.length;

  // A clip always starts from the top when it takes over.
  useEffect(() => {
    const v = clipRefs.current[clip];
    if (v) v.currentTime = 0;
  }, [clip, motionOk]);

  useEffect(() => {
    clipRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === clip && animate) v.play().catch(() => {});
      else v.pause();
    });
  }, [clip, animate]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (filmOpen && !d.open) d.showModal();
    if (!filmOpen && d.open) d.close();
  }, [filmOpen]);

  function showProgress(i: number, v: HTMLVideoElement) {
    const fill = fillRefs.current[i];
    if (fill && v.duration) fill.style.transform = `scaleX(${v.currentTime / v.duration})`;
  }

  return (
    <section className={`home-hero${motionOk ? ' is-live' : ''}`}>
      <NavOnMedia />
      <div className="home-hero-media" aria-hidden="true">
        <Image src="/photo_2026-09-29_14-16-58.jpg" alt="" fill priority sizes="100vw" />
        {motionOk &&
          CLIPS.map((src, i) => (
            <video
              key={src}
              ref={(el) => {
                clipRefs.current[i] = el;
              }}
              className={`home-hero-clip${i === clip ? ' is-active' : ''}`}
              src={i === clip || i === next ? src : undefined}
              muted
              playsInline
              preload={i === clip ? 'auto' : 'metadata'}
              onTimeUpdate={(e) => showProgress(i, e.currentTarget)}
              onEnded={() => setClip((c) => (c + 1) % CLIPS.length)}
            />
          ))}
      </div>
      <div className="home-hero-shade" aria-hidden="true" />
      <div className="home-hero-grain" aria-hidden="true" />

      <div className="container home-hero-body">
        <div className="home-hero-main">
          <div className="home-hero-copy">
            <h1 className="home-hero-title">
              <span className="hero-line">
                <span className="hero-line-in">Maîtrisez le négoce</span>
              </span>{' '}
              <span className="hero-line">
                <span className="hero-line-in" style={delay(0.08)}>
                  international <span className="hero-accent">des</span>
                </span>
              </span>{' '}
              <span className="hero-line">
                <span className="hero-line-in hero-accent" style={delay(0.16)}>
                  matières premières.
                </span>
              </span>
            </h1>

            <p className="home-hero-lead hero-rise" style={delay(0.38)}>
              Formations certifiantes et accompagnement par des praticiens du terrain&nbsp;: sourcing,
              sécurisation des paiements, logistique et export.
            </p>

            <div className="home-hero-actions hero-rise" style={delay(0.48)}>
              <Link href="#formations" className="hero-cta">
                Voir les formations
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </Link>
              <button type="button" className="hero-watch" onClick={() => setFilmOpen(true)}>
                <span className="hero-watch-icon">
                  <PlayIcon size={14} />
                </span>
                Regarder la masterclass
              </button>
            </div>
          </div>

          <button
            type="button"
            className="hero-film hero-rise"
            style={delay(0.6)}
            onClick={() => setFilmOpen(true)}
            aria-label="Regarder la masterclass gratuite de Josette Kameni, 45 minutes"
          >
            <span className="hero-film-thumb">
              <Image
                src="/founder-portrait.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 160px, 540px"
                style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
              />
              <span className="hero-film-play">
                <PlayIcon size={26} />
              </span>
            </span>
            <span className="hero-film-text">
              <span className="hero-film-tag">Masterclass gratuite · 45 min</span>
              <span className="hero-film-title">Les premières clés du négoce international</span>
              <span className="hero-film-by">avec Josette Kameni</span>
            </span>
          </button>
        </div>

        <div className="home-hero-band hero-rise" style={delay(0.72)}>
          <dl className="home-hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="home-hero-stat">
                <dt>{s.label}</dt>
                <dd className="counter-value" data-target={s.value} data-suffix={s.suffix}>
                  {s.value}
                  {s.suffix}
                </dd>
              </div>
            ))}
          </dl>

          {motionOk && (
            <div className="home-hero-controls">
              {CLIPS.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`hero-seg${i < clip ? ' is-done' : ''}`}
                  onClick={() => setClip(i)}
                  aria-label={`Séquence ${i + 1} sur ${CLIPS.length}`}
                  aria-current={i === clip ? 'true' : undefined}
                >
                  <span className="hero-seg-track">
                    <span
                      className="hero-seg-fill"
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                    />
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="hero-ctl-btn"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Mettre les animations en pause' : 'Reprendre les animations'}
              >
                {playing ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="5" y="4" width="5" height="16" rx="1.5" />
                    <rect x="14" y="4" width="5" height="16" rx="1.5" />
                  </svg>
                ) : (
                  <PlayIcon size={12} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="film-dialog"
        aria-label="Masterclass gratuite de Josette Kameni"
        onClose={() => setFilmOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setFilmOpen(false);
        }}
      >
        <div className="film-dialog-frame">
          {filmOpen && <video src={FREE_COURSE_VIDEO} controls autoPlay playsInline preload="auto" />}
        </div>
        <button type="button" className="film-dialog-close" onClick={() => setFilmOpen(false)} aria-label="Fermer la vidéo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </dialog>
    </section>
  );
}
