import Link from 'next/link';

import HeroSlider from '@/app/components/HeroSlider';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { cachedPlatformStats, cachedPopularCourses } from '@/lib/catalog/cached';
import { plural } from '@/lib/plural';
import { HomeEffects } from './HomeEffects';

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

export default async function HomePage() {
  const [popular, stats] = await Promise.all([cachedPopularCourses(8), cachedPlatformStats()]);

  return (
    <>
      <HomeEffects />
      <HeroSlider />

      {/* ========== COURSE CATALOGUE ========== */}
      <section id="formations" className="section course-section">
        <div className="container">
          <div className="fade-up" style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4.5vw, 3rem)', marginBottom: '15px' }}>
              Formations <span style={{ color: 'var(--gold-main)' }}>populaires.</span>
            </h2>
            {stats.courses > 0 && (
              <p className="text-lead" style={{ maxWidth: '700px', margin: 0 }}>
                {plural(stats.courses, 'formation', 'formations')} par {plural(stats.instructors, 'formateur', 'formateurs')} pour propulser votre carrière dans le commerce international.
              </p>
            )}
          </div>
          {popular.length > 0 ? (
            <CourseGrid courses={popular} />
          ) : (
            <p className="text-muted">Les premières formations arrivent très bientôt.</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 40 }}>
            <Link href="/courses" className="btn btn-primary">Voir tout le catalogue</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-premium glass-card fade-up">
            <h2 style={{ marginBottom: '16px' }}>Vous êtes expert du négoce ou de l’export ?</h2>
            <p className="text-lead" style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
              Publiez votre formation sur Proactive Académie et transmettez votre savoir-faire à une nouvelle génération de négociants.
            </p>
            <Link href="/signup?next=%2Fteach" className="btn btn-secondary">Devenir formateur</Link>
          </div>
        </div>
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
