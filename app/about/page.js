'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useScrollAnimations } from '../hooks';

export default function AboutPage() {
  useScrollAnimations();

  const videoItems = [
    {
      src: '/video_2026-09-29_14-16-45.mp4',
      img: '/photo_2026-09-29_14-16-58.jpg',
      title: 'Masterclass Intensive',
      desc: "Immersion totale dans les stratégies d'exportation avec nos experts terrain. Apprentissage des normes qualité et circuits de distribution internationaux."
    },
    {
      src: '/video_2026-09-29_14-16-46.mp4',
      img: '/photo_2026-09-29_14-16-59.jpg',
      title: "Networking d'Élite",
      desc: 'Rencontres exclusives B2B entre producteurs africains, acheteurs internationaux et les décideurs logistiques du réseau Proactive.'
    },
    {
      src: '/video_2026-09-29_14-16-47.mp4',
      img: '/photo_2026-09-29_14-17-00.jpg',
      title: 'Ateliers Pratiques',
      desc: 'De la théorie à l\'action. Nos apprenants travaillent sur des cas concrets de qualification de marchandises et de sécurisation douanière.'
    },
    {
      src: '/video_2026-09-29_14-16-49.mp4',
      img: '/photo_2026-09-29_14-17-01.jpg',
      title: 'Événements & Succès',
      desc: 'Célébration des partenariats signés et des exportations réussies par notre communauté dynamique sur le terrain.'
    }
  ];

  const founderStats = [
    { value: '40+', label: "Ans d'Expérience", color: 'var(--gold-main)' },
    { value: '25+', label: "Pays d'Opération", color: 'var(--emerald-main)' },
    { value: '500+', label: 'Apprenants Formés', color: 'var(--gold-main)' }
  ];

  const missionSteps = [
    { num: '1', text: 'De la matière première à la valeur ajoutée.', color: 'var(--gold-main)' },
    { num: '2', text: 'Du producteur au marché international.', color: 'var(--emerald-main)' },
    { num: '3', text: "Du savoir-faire à l'opportunité.", color: 'var(--gold-main)' },
    { num: '4', text: "De l'Afrique au monde.", color: 'var(--emerald-main)' }
  ];

  return (
    <>
      <style>{`
        .about-founder {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: var(--bg-main);
        }
        .about-founder-inner {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: 60px;
        }
        .about-founder-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: clamp(40px, 5vw, 60px);
          width: 100%;
          align-items: stretch;
        }
        .founder-copy {
          padding-right: 40px;
        }
        .about-right-portrait {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 420px;
          border-radius: 20px;
          overflow: hidden;
        }
        .about-right-portrait::before {
          content: '';
          position: absolute;
          inset: -8px;
          border: 2px solid var(--emerald-main);
          border-radius: 28px;
          z-index: 2;
          pointer-events: none;
          opacity: 0.3;
        }
        .founder-quote {
          position: relative;
          padding-left: 25px;
          border-left: 3px solid var(--gold-main);
          margin-bottom: 25px;
        }
        .founder-stats {
          display: flex;
          flex-wrap: wrap;
          gap: clamp(20px, 3vw, 30px);
          padding-top: 15px;
          border-top: 1px solid var(--border-subtle);
        }
        .founder-stat-value {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 700;
          font-family: 'Cinzel', serif;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .founder-stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 10px;
        }

        .role-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 60px;
        }
        .role-card {
          position: relative;
          padding: clamp(28px, 4vw, 50px);
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .role-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }
        .role-card.negoce::before {
          background: linear-gradient(to right, var(--gold-main), transparent);
        }
        .role-card.formation::before {
          background: linear-gradient(to right, var(--emerald-main), transparent);
        }
        .role-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .role-card-head {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }
        .role-card-body {
          color: var(--text-muted);
          line-height: 1.8;
          font-size: 1.05rem;
          margin-bottom: 25px;
        }
        .role-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .role-tag {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
        }

        .mission-banner {
          position: relative;
          padding: clamp(40px, 6vw, 80px) clamp(24px, 5vw, 60px);
          border-radius: 30px;
          background: linear-gradient(135deg, var(--banner-grad-a) 0%, var(--banner-grad-b) 100%);
          border: 1px solid var(--border-gold);
          overflow: hidden;
        }
        .mission-banner::before,
        .mission-banner::after {
          content: '';
          position: absolute;
          width: min(500px, 90vw);
          height: min(500px, 90vw);
          pointer-events: none;
        }
        .mission-banner::before {
          top: -50%;
          right: -20%;
          background: radial-gradient(circle, var(--emerald-glow) 0%, transparent 70%);
        }
        .mission-banner::after {
          bottom: -50%;
          left: -20%;
          background: radial-gradient(circle, var(--gold-glow) 0%, transparent 70%);
        }
        .mission-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .mission-step {
          text-align: center;
          padding: 30px 20px;
          border-radius: 15px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .mission-step-num {
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 700;
          font-family: 'Cinzel', serif;
          margin-bottom: 15px;
          line-height: 1;
        }
        .mission-step p {
          color: var(--text-muted);
          margin: 0;
          font-size: 1rem;
          line-height: 1.6;
        }

        .video-list {
          display: flex;
          flex-direction: column;
          gap: 40px;
          margin-bottom: 80px;
        }
        .video-showcase {
          position: relative;
          display: grid;
          grid-template-columns: 65fr 35fr;
          gap: clamp(24px, 3vw, 40px);
          align-items: center;
          border-radius: 24px;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .video-frame {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background-color: var(--surface-media);
        }
        .video-frame video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-copy {
          padding: 15px 40px 40px 0;
        }
        .video-copy h4 {
          font-size: clamp(1.5rem, 2.4vw, 2rem);
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          color: var(--gold-main);
          margin-bottom: 15px;
          line-height: 1.2;
        }
        .video-still {
          position: relative;
          width: 100%;
          height: clamp(140px, 22vw, 180px);
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
        }
        .video-copy p {
          color: var(--text-muted);
          font-size: 1.05rem;
          line-height: 1.7;
          margin: 0 0 25px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }
        .photo-item {
          position: relative;
          height: clamp(200px, 26vw, 300px);
          border-radius: 15px;
          overflow: hidden;
          background-color: var(--surface-media);
        }
        .photo-item img {
          filter: brightness(0.9);
          transition: transform 0.7s cubic-bezier(0.25, 1, 0.5, 1), filter 0.5s ease !important;
        }

        .featured-article {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: clamp(32px, 4vw, 50px);
          align-items: center;
          padding: clamp(28px, 5vw, 60px);
          border-radius: 30px;
          background: linear-gradient(135deg, var(--gold-glow), var(--emerald-glow));
          border: 1px solid var(--border-gold);
        }
        .article-image {
          position: relative;
          height: clamp(280px, 40vw, 450px);
          border-radius: 20px;
          overflow: hidden;
        }
        .article-source {
          position: absolute;
          top: 20px;
          left: 20px;
          padding: 8px 16px;
          background: var(--gold-main);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--bg-dark);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @media (hover: hover) {
          .role-card:hover {
            transform: translateY(-8px);
            box-shadow: var(--card-shadow-hover);
          }
          .mission-step:hover {
            transform: translateY(-5px);
            background: var(--bg-card-hover);
          }
          .video-showcase:hover {
            transform: translateY(-8px);
            box-shadow: var(--card-shadow-hover);
          }
          .video-showcase:hover video {
            opacity: 1 !important;
          }
          .photo-item:hover img {
            transform: scale(1.08) !important;
            filter: brightness(1.1) !important;
          }
        }

        @media (max-width: 1024px) {
          .about-founder-grid { grid-template-columns: 1fr; }
          .founder-copy { padding-right: 0; }
          .about-right-portrait { min-height: 380px; }
          .role-grid { grid-template-columns: 1fr; gap: 24px; margin-bottom: 40px; }
          .featured-article { grid-template-columns: 1fr; }
          .video-showcase { grid-template-columns: 1fr; }
          .video-copy { padding: 0 clamp(20px, 4vw, 32px) clamp(24px, 4vw, 32px); }
          .video-list { gap: 28px; margin-bottom: 56px; }
        }

        @media (max-width: 768px) {
          .mission-steps { grid-template-columns: repeat(2, 1fr); }
          .photo-grid { grid-template-columns: repeat(2, 1fr); }
          .about-right-portrait { min-height: 320px; }
        }

        @media (max-width: 520px) {
          .mission-steps { grid-template-columns: 1fr; }
          .mission-step { padding: 24px 18px; }
          .role-card-head { gap: 14px; }
          .founder-stats { gap: 24px; }
        }
      `}</style>

      {/* ========== SECTION 1: FOUNDER SPLIT (Like Hero) ========== */}
      <section className="about-founder">
        <div className="container about-founder-inner">
          <div className="about-founder-grid">
            {/* LEFT: Text Content */}
            <div className="fade-up founder-copy">
              <div className="badge-premium" style={{ marginBottom: '15px' }}>
                <span className="badge-dot"></span>
                <span className="badge-text" style={{ letterSpacing: '0.2em' }}>NOTRE FONDATRICE</span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 4rem)', marginBottom: '20px', lineHeight: 1.05 }}>
                L'Ambassadrice<br/>du <span className="text-gradient-gold">Négoce.</span>
              </h1>

              <div className="founder-quote">
                <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  Figure africaine emblématique dans le négoce international, couronnée de multiples contrats mondiaux, on l'appelle <strong style={{ color: 'var(--gold-main)' }}>« La Reine du Négoce »</strong>.
                </p>
              </div>

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '15px', fontSize: '1rem' }}>
                Forte de <strong>40 ans d'expérience</strong> dans l'entrepreneuriat (santé, éducation, restauration), Josette Kameni arpente le monde pour maîtriser les rouages du commerce international - de l'Afrique, pourvoyeur infini de matières premières, aux marchés d'Asie et d'Occident.
              </p>

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '25px', fontSize: '1rem' }}>
                Joviale et débordante d'énergie positive, ce ne sont pas les obstacles qui la définissent, mais son courage inébranlable à élever l'Afrique sur l'échiquier mondial.
              </p>

              <div className="founder-stats">
                {founderStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="founder-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="founder-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '40px' }}>
                <Link href="/livres" className="btn" style={{ padding: '12px 32px', fontSize: '0.9rem', backgroundColor: 'transparent', border: '1px solid var(--gold-main)', color: 'var(--gold-main)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Découvrir ses ouvrages
                </Link>
              </div>
            </div>

            {/* RIGHT: Portrait Image (like Hero banner-img) */}
            <div className="about-right-portrait fade-up" style={{ transitionDelay: '0.3s' }}>
              <Image
                src="/founder-portrait.jpg"
                alt="Josette Kameni - Fondatrice de Proactive Services"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: VISION & ROLE (Refined Cards) ========== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-darker)', position: 'relative', overflow: 'hidden' }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 'clamp(48px, 7vw, 80px)' }}>
            <div className="badge-premium" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              <span className="badge-dot"></span>
              <span className="badge-text">CE QUE NOUS FAISONS</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '20px' }}>Notre Vision & Notre Rôle</h2>
            <p className="text-lead" style={{ maxWidth: '800px', margin: '0 auto' }}>
              L'Afrique ne doit pas seulement exporter ses matières premières - elle doit les valoriser, les transformer et les connecter intelligemment aux marchés internationaux.
            </p>
          </div>

          <div className="role-grid">
            {/* Négoce Card */}
            <div className="role-card negoce fade-up">
              <div className="role-card-head">
                <div className="role-card-icon" style={{ background: 'linear-gradient(135deg, var(--gold-glow), transparent)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-main)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><path d="M2 12h20"/>
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold-main)', display: 'block', marginBottom: '4px' }}>Pilier 01</span>
                  <h3 style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.6rem)', margin: 0 }}>Opérations de Négoce</h3>
                </div>
              </div>
              <p className="role-card-body">
                Nous identifions les opportunités rares, qualifions les fournisseurs avec rigueur, mettons en relation l'offre et la demande, et sécurisons de bout-en-bout chaque opération commerciale internationale.
              </p>
              <div className="role-tags">
                {['Sourcing', 'Qualification', 'Négociation', 'Sécurisation'].map((tag, i) => (
                  <span key={i} className="role-tag" style={{ background: 'var(--tint-gold)', border: '1px solid var(--border-gold)', color: 'var(--on-tint-gold)' }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Formation Card */}
            <div className="role-card formation fade-up" style={{ transitionDelay: '0.15s' }}>
              <div className="role-card-head">
                <div className="role-card-icon" style={{ background: 'linear-gradient(135deg, var(--emerald-glow), transparent)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-main)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--emerald-main)', display: 'block', marginBottom: '4px' }}>Pilier 02</span>
                  <h3 style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.6rem)', margin: 0 }}>L'Académie Proactive</h3>
                </div>
              </div>
              <p className="role-card-body">
                Nous transmettons notre savoir-faire d'excellence à celles et ceux qui souhaitent se lancer et prospérer dans le commerce international grâce à une méthodologie éprouvée.
              </p>
              <div className="role-tags" style={{ gap: '8px' }}>
                {['Sourcer', 'Qualifier', 'Acheteurs', 'Offre', 'Négocier', 'Sécuriser', 'Logistique', 'Commercialiser'].map((tag, i) => (
                  <span key={i} className="role-tag" style={{ background: 'var(--tint-emerald)', border: '1px solid var(--border-subtle)', color: 'var(--on-tint-emerald)' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Mission Banner (Refined) */}
          <div className="mission-banner fade-up">
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <span style={{ display: 'inline-block', padding: '8px 20px', background: 'var(--tint-gold)', border: '1px solid var(--border-gold)', borderRadius: '30px', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--on-tint-gold)', marginBottom: '30px' }}>Notre Mission</span>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.2rem)', marginBottom: 'clamp(32px, 5vw, 50px)', lineHeight: 1.3 }}>
                Rendre le Négoce plus accessible,<br/>plus professionnel et plus structuré.
              </h3>
              <div className="mission-steps">
                {missionSteps.map((step, i) => (
                  <div key={i} className="mission-step">
                    <div className="mission-step-num" style={{ color: step.color }}>{step.num}</div>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: COMMUNITY PROOF ========== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: 'left', marginBottom: 'clamp(40px, 6vw, 60px)' }}>
            <div className="badge-premium" style={{ marginBottom: '20px' }}>
              <span className="badge-dot"></span>
              <span className="badge-text">PREUVES SOCIALES</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '20px' }}>Un Réseau Actif.<br/><span className="text-gradient-green">Des Résultats Concrets.</span></h2>
            <p className="text-lead" style={{ maxWidth: '700px' }}>
              Proactive Services n'est pas qu'une entreprise. C'est un écosystème d'experts, d'apprenants et de partenaires qui collaborent sur le terrain.
            </p>
          </div>

          {/* Video Showcase List */}
          <div className="video-list">
            {videoItems.map((video, index) => (
              <div key={index} className="video-showcase fade-up" style={{ transitionDelay: (index * 0.1) + 's' }}>
                <div className="video-frame">
                  <video
                    src={video.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
                <div className="video-copy">
                  <h4>{video.title}</h4>
                  <div className="video-still">
                    <Image src={video.img} alt={video.title} fill sizes="(max-width: 1024px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
                  </div>
                  <p>{video.desc}</p>
                  <Link href="#" className="btn btn-emerald" style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                    Participer à la prochaine édition &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Event Photos */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.8rem)' }}>Galerie d'Événements</h3>
          </div>
          <div className="photo-grid">
            {[
              '/photo_2026-09-29_14-16-58.jpg',
              '/photo_2026-09-29_14-16-59.jpg',
              '/photo_2026-09-29_14-17-00.jpg',
              '/photo_2026-09-29_14-17-01.jpg'
            ].map((src, index) => (
              <div key={index} className="photo-item">
                <Image
                  src={src}
                  alt="Communauté Proactive"
                  fill
                  sizes="(max-width: 520px) 100vw, (max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: FEATURED ARTICLE (BipMedia) ========== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-darker)' }}>
        <div className="container">
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 60px)' }}>
            <div className="badge-premium" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              <span className="badge-dot"></span>
              <span className="badge-text">DANS LA PRESSE</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '10px' }}>Ils parlent de <span className="text-gradient-gold">nous.</span></h2>
          </div>

          <div className="featured-article fade-up">
            {/* Article Image */}
            <div className="article-image">
              <Image
                src="/photo_2026-09-29_14-16-52.jpg"
                alt="Josette Kameni - Interview BipMedia"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="article-source">
                BipMedia.be
              </div>
            </div>

            {/* Article Content */}
            <div>
              <span style={{ display: 'inline-block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Interview Exclusive · BipMedia Belgique</span>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '25px', lineHeight: 1.3 }}>
                Josette Kameni lève un voile sur le Négoce International des Matières Premières
              </h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.1rem', marginBottom: '30px' }}>
                Découvrez le parcours exceptionnel de la « Reine du Négoce ». Dans cette interview exclusive, Josette Kameni partage sa vision de l'entrepreneuriat africain et dévoile les clés pour s'imposer sur le marché international des matières premières.
              </p>

              <a
                href="https://www.bipmedia.be/fr/rencontre-avec-josette-kameni-experte-en-negoce-international/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 35px' }}
              >
                Lire l'article complet
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="glass-card fade-up" style={{ padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 40px)', maxWidth: '900px', margin: '0 auto', borderTop: '2px solid var(--emerald-main)' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '20px' }}>Intégrez notre Écosystème.</h2>
            <p className="text-lead" style={{ marginBottom: '40px' }}>
              Que vous cherchiez à sourcer des produits de classe mondiale ou à vous former, notre réseau vous ouvre ses portes.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/formation" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.05rem' }}>
                Rejoindre l'Académie
              </Link>
              <Link href="/contact" className="btn btn-secondary" style={{ padding: '16px 40px', fontSize: '1.05rem' }}>
                Devenir Partenaire
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
