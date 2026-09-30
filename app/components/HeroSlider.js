'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const FREE_COURSE_VIDEO =
  'https://d1yei2z3i6k35z.cloudfront.net/10007092/673c509a59aee_FORMATIONGRATUITEJOSETTEKAMENIOK.mp4';

const slides = [
  {
    id: 1,
    image: '/negoce 1.jpeg',
    detailImage: '/trading-port.jpg',
    title: 'Maîtrisez le négoce.',
    subtitle: 'Formations d\'élite.',
    desc: 'Découvrez nos programmes de formation certifiants. Devenez un expert du sourcing et de l\'exportation des matières premières.',
    iconImg: '/media_1790652867960.png'
  },
  {
    id: 2,
    image: '/negoce 2.jpeg',
    detailImage: '/hero-commodities.jpg',
    title: 'De la théorie',
    subtitle: 'À la pratique.',
    desc: 'Un cursus complet conçu par des experts du terrain. Apprenez à structurer, sécuriser et rentabiliser vos opérations.',
    iconImg: null
  },
  {
    id: 3,
    image: '/negoce3.jpeg',
    detailImage: '/africa-landscape.jpg',
    title: 'Accélérez votre',
    subtitle: 'Carrière mondiale.',
    desc: 'Rejoignez l\'Académie Proactive et bénéficiez d\'un accompagnement sur-mesure pour exceller sur les marchés internationaux.',
    iconImg: '/media_1790652868023.png'
  },
  {
    id: 4,
    image: '/negoce4.jpeg',
    detailImage: '/warehouse-premium.jpg',
    title: 'Sécurisez vos',
    subtitle: 'Investissements.',
    desc: 'Maîtrisez les risques financiers, logistiques et douaniers grâce à nos modules de formation intensifs.',
    iconImg: null
  },
  {
    id: 5,
    image: '/negoce5.jpeg',
    detailImage: '/academy-training.jpg',
    title: 'Rejoignez notre',
    subtitle: 'Réseau exclusif.',
    desc: 'En rejoignant nos formations, vous intégrez immédiatement un réseau d\'élite de fournisseurs et d\'acheteurs internationaux.',
    iconImg: null
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    // the slide rotation would yank the ground out from under someone watching
    if (isPaused || videoStarted) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, videoStarted]);

  function offsetFor(index) {
    if (index === current) return 'translateX(0)';
    const previous = (current - 1 + slides.length) % slides.length;
    return index === previous ? 'translateX(15vw)' : 'translateX(-15vw)';
  }

  return (
    <section className="hero hero-slider">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className="hero-bg"
          style={{
            opacity: index === current ? 1 : 0,
            zIndex: index === current ? 1 : 0
          }}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            style={{
              objectFit: 'cover',
              transform: index === current ? 'scale(1)' : 'scale(1.05)',
              transition: 'transform 8s ease-out'
            }}
            sizes="100vw"
            priority={index === 0}
            quality={100}
          />
        </div>
      ))}

      <div className="hero-overlay" />

      <div className="container hero-container">
        <div className="hero-grid">
          <div
            className="hero-text-stack"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {slides.map((slide, index) => (
              <div
                key={`text-${slide.id}`}
                className="hero-slide-text"
                style={{
                  opacity: index === current ? 1 : 0,
                  transform: offsetFor(index),
                  zIndex: index === current ? 2 : 1,
                  pointerEvents: index === current ? 'auto' : 'none'
                }}
                aria-hidden={index !== current}
              >
                <div className="hero-meter">
                  <div className="hero-meter-count">
                    0{index + 1} <span>/ 0{slides.length}</span>
                  </div>
                  <div className="hero-progress-bar">
                    {index === current && (
                      <div
                        className="hero-progress-fill"
                        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                      />
                    )}
                  </div>
                  {slide.iconImg && (
                    <div className="hero-topic-icon">
                      <Image src={slide.iconImg} alt="" fill sizes="192px" style={{ objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

                <div className="hero-quote-mark" aria-hidden="true">&ldquo;</div>

                <h1 className="hero-title">
                  <span>{slide.title}</span>{' '}
                  <span className="text-gradient">{slide.subtitle}</span>
                </h1>

                <p className="text-lead hero-desc">{slide.desc}</p>
              </div>
            ))}
          </div>

          <div className="hero-right-visual">
            <div className="hero-visual-frame">
              <div className="hero-cta-card">
                <div className="hero-video">
                  {videoStarted ? (
                    <video
                      className="hero-video-el"
                      src={FREE_COURSE_VIDEO}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                    />
                  ) : (
                    <button
                      type="button"
                      className="hero-video-poster"
                      onClick={() => setVideoStarted(true)}
                      aria-label="Lire la formation gratuite de Josette Kameni"
                    >
                      <Image
                        src="/founder-portrait.jpg"
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 90vw, 420px"
                        style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                      />
                      <span className="hero-video-play">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path
                            d="M9 6.35v11.3a1 1 0 0 0 1.5.87l9.5-5.65a1 1 0 0 0 0-1.74L10.5 5.48A1 1 0 0 0 9 6.35z"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <span className="hero-video-badge">Formation gratuite · 45 min</span>
                    </button>
                  )}
                </div>

                <div className="hero-cta-rating">
                  <span className="hero-cta-stars" aria-hidden="true">★★★★★</span>
                  <span className="hero-cta-count">+500 Apprenants Suivis</span>
                </div>

                <h3 className="hero-cta-title">
                  Formation <span className="text-gradient">Gratuite.</span>
                </h3>
                <p className="hero-cta-desc">
                  Regardez cette masterclass offerte par Josette Kameni et découvrez les premières clés du négoce international, sans engagement.
                </p>

                <Link href="#formations" className="btn btn-primary hero-cta-btn">
                  Formation &amp; Accompagnement 100%
                </Link>
              </div>
            </div>
          </div>

          {/* Identical across every slide, so it's a single static block rather
              than duplicated per-slide markup. On mobile (single column) this
              also means it renders after the video card above, matching the
              stacked reading order; on desktop, grid auto-placement drops it
              into the next open cell under the text column. */}
          <div className="hero-buttons">
            <Link href="#formations" className="btn btn-emerald hero-btn">
              Nos Formations
            </Link>
            <Link href="/about" className="hero-link">
              À propos de nous
              <span className="hero-link-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}
