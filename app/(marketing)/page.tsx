'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useScrollAnimations, useCounterAnimation, useParallax } from '@/app/hooks';

import HeroSlider from '@/app/components/HeroSlider';

function Stars({ className }: { className?: string }) {
  return (
    <span className={className} aria-label="5 étoiles sur 5" role="img">
      ★★★★★
    </span>
  );
}

const TESTIMONIALS = [
  {
    quote: 'Proactive Services a transformé notre approche du sourcing en Afrique. Un partenaire absolument incontournable pour nos opérations.',
    who: 'CEO',
    org: 'Global Trade',
  },
  {
    quote: 'Une expertise inégalée en sécurisation des paiements internationaux (Credoc). La sérénité à chaque transaction.',
    who: 'Directeur Financier',
    org: 'AgriCorp',
  },
  {
    quote: "La formation de l'Académie m'a permis de structurer mon entreprise et de doubler mon chiffre d'affaires à l'export.",
    who: 'Entrepreneur Indépendant',
    org: null,
  },
  {
    quote: 'Un accompagnement sur-mesure sur les aspects juridiques et logistiques pour notre expansion sur le continent.',
    who: 'Directrice Supply Chain',
    org: null,
  },
];

export default function HomePage() {
  useScrollAnimations();
  useCounterAnimation();
  // Parallax is now handled internally by HeroSlider for the hero, keeping it for others if needed
  useParallax('.image-frame img');

  return (
    <>
      <HeroSlider />

      {/* ========== COURSE CATALOGUE ========== */}
      <section className="section course-section">
        <div className="container">
          <div className="fade-up" style={{ textAlign: 'left', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '15px' }}>
              Nos Formations <span style={{ color: 'var(--gold-main)' }}>D&apos;Excellence.</span>
            </h2>
            <p className="text-lead" style={{ maxWidth: '700px', margin: '0' }}>
              Accédez à notre catalogue de formations certifiantes et propulsez votre carrière dans le commerce international.
            </p>
          </div>

          <div className="course-grid">
            {[
              { img: '/photo_2026-09-29_14-16-58.jpg', cat: 'NÉGOCE', title: 'Les Fondements du Négoce International', price: '990 €' },
              { img: '/photo_2026-09-29_14-16-59.jpg', cat: 'LOGISTIQUE', title: 'Maîtriser la Supply Chain Africaine', price: '750 €' },
              { img: '/photo_2026-09-29_14-17-00.jpg', cat: 'QUALITÉ', title: 'Normes et Certifications à l\'Export', price: '500 €' },
              { img: '/photo_2026-09-29_14-17-01.jpg', cat: 'FINANCE', title: 'Sécurisation des Paiements (Credoc)', price: '1,200 €' },
              { img: '/negoce 1.jpeg', cat: 'STRATÉGIE', title: 'Pénétrer le Marché Européen', price: '1,500 €' },
              { img: '/negoce 2.jpeg', cat: 'SOURCING', title: 'Identifier les Fournisseurs Fiables', price: '850 €' },
              { img: '/negoce3.jpeg', cat: 'DOUANE', title: 'Optimisation Douanière et Incoterms', price: '600 €' },
              { img: '/negoce4.jpeg', cat: 'JURIDIQUE', title: 'Rédaction de Contrats de Vente', price: '900 €' }
            ].map((course, i) => (
              <div key={i} className="course-card fade-up">
                {/* Thumbnail */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Image src={course.img} alt={course.title} fill sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, (max-width: 1200px) 33vw, 25vw" style={{ objectFit: 'cover' }} className="course-img" />
                  <div className="course-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)', transition: 'background-color 0.2s' }}></div>
                  
                  {/* Diagonal Bestseller Ribbon */}
                  {(i === 0 || i === 1 || i === 4) && (
                    <div style={{ position: 'absolute', top: '15px', left: '-35px', width: '150px', backgroundColor: '#eceb98', color: '#3d3c0a', textAlign: 'center', padding: '4px 0', fontSize: '0.7rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", transform: 'rotate(-45deg)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Best Seller
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Title */}
                  <h3 style={{ fontSize: '1.05rem', fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.title}
                  </h3>
                  
                  {/* Author */}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 4px 0', fontFamily: "'Outfit', sans-serif" }}>
                    Josette Kameni
                  </p>
                  
                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontFamily: "'Outfit', sans-serif" }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--rating-star)' }}>4.9</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--rating-star)', letterSpacing: '-1px' }} aria-hidden="true">★★★★★</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '2px' }}>(320)</span>
                  </div>
                  
                  {/* Price & Buy Button Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>{course.price}</span>
                    <button className="udemy-buy-btn" style={{ minHeight: '44px', padding: '8px 32px', backgroundColor: 'var(--cta-emerald-bg)', color: 'var(--cta-emerald-fg)', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'filter 0.2s ease' }}>
                      Obtenir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .course-card:hover .course-overlay {
            background-color: rgba(0,0,0,0.2);
          }
          .udemy-buy-btn:hover {
            filter: brightness(1.15);
          }
        `}</style>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="section testimonial-section">
        <div className="container">
          <div className="fade-up" style={{ marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)' }}>
              Ils nous font <span style={{ color: 'var(--gold-main)' }}>confiance.</span>
            </h2>
          </div>

          <figure className="quote-lead fade-up">
            <span className="quote-mark" aria-hidden="true">&ldquo;</span>
            <div>
              <Stars className="quote-lead-stars" />
              <blockquote className="quote-lead-text">{TESTIMONIALS[0].quote}</blockquote>
              <figcaption className="quote-attrib">
                <strong>{TESTIMONIALS[0].who}</strong>
                {TESTIMONIALS[0].org && <span>{TESTIMONIALS[0].org}</span>}
              </figcaption>
            </div>
          </figure>

          <div className="quote-support-grid stagger-children">
            {TESTIMONIALS.slice(1).map((item) => (
              <figure key={item.who} className="quote-support">
                <Stars className="quote-support-stars" />
                <blockquote className="quote-support-text">{item.quote}</blockquote>
                <figcaption className="quote-support-attrib">
                  <strong>{item.who}</strong>
                  {item.org && <span>{item.org}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ========== VALUES GRID ========== */}
      <section className="section" style={{ backgroundColor: 'var(--bg-darker)' }}>
        <div className="container">
          <div className="fade-up">
            <div className="badge-premium">
              <span className="badge-dot"></span>
              <span className="badge-text">L&apos;Écosystème Proactive</span>
            </div>
            <h2>Nos piliers stratégiques</h2>
          </div>

          <div className="values-grid stagger-children">
            <div className="value-card">
              <div className="value-icon" style={{ marginBottom: '20px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-main)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              </div>
              <h3>Sourcing d&apos;Élite</h3>
              <p>Identification et qualification des meilleures matières premières africaines selon des standards internationaux rigoureux.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ marginBottom: '20px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-main)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h3>Sécurisation</h3>
              <p>Maîtrise absolue des risques transactionnels, juridiques et logistiques pour des opérations fluides et garanties.</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ marginBottom: '20px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-main)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <h3>Transmission</h3>
              <p>Formation d&apos;une nouvelle génération de négociants africains via notre Académie d&apos;excellence.</p>
            </div>
          </div>
        </div>
      </section>



      {/* ========== STATS ========== */}
      <section className="section">
        <div className="container">
          <div className="stats-premium stagger-children">
            <div>
              <div className="stat-number counter-value" data-target="150" data-suffix="+">0</div>
              <div className="stat-label">Partenaires Mondiaux</div>
            </div>
            <div>
              <div className="stat-number counter-value" data-target="25" data-suffix="">0</div>
              <div className="stat-label">Pays d&apos;Opération</div>
            </div>
            <div>
              <div className="stat-number counter-value" data-target="500" data-suffix="+">0</div>
              <div className="stat-label">Apprenants Formés</div>
            </div>
            <div>
              <div className="stat-number counter-value" data-target="98" data-suffix="%">0</div>
              <div className="stat-label">Taux de Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="section">
        <div className="container">
          <div className="cta-premium glass-card fade-up">
            <h2 style={{ marginBottom: '20px' }}>Prêt à transformer les opportunités ?</h2>
            <p className="text-lead" style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
              Rejoignez l&apos;écosystème Proactive Services pour structurer vos opérations de négoce ou vous former à l&apos;excellence internationale.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <Link href="/about" className="btn btn-primary">
                Contactez-nous
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
