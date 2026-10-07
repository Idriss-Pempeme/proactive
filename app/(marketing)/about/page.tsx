import Image from 'next/image';
import Link from 'next/link';
import { cachedCategories, cachedPlatformStats } from '@/lib/catalog/cached';
import { HomeEffects } from '../HomeEffects';
import { FieldGallery } from './FieldGallery';
import styles from './about.module.css';

const CONTACT_EMAIL = 'direction@proactiveservices.com';

const PILLARS = [
  {
    tone: 'orange',
    name: 'Opérations de négoce',
    body: "Nous identifions les opportunités rares, qualifions les fournisseurs avec rigueur, mettons en relation l'offre et la demande, et sécurisons de bout en bout chaque opération commerciale internationale.",
    items: ['Sourcing', 'Qualification', 'Négociation', 'Sécurisation'],
  },
  {
    tone: 'green',
    name: "L'Académie Proactive",
    body: "Nous transmettons notre savoir-faire à celles et ceux qui souhaitent se lancer et prospérer dans le commerce international, grâce à une méthodologie éprouvée sur le terrain.",
    items: ['Sourcer', 'Qualifier', 'Trouver des acheteurs', "Construire l'offre", 'Négocier', 'Sécuriser', 'Logistique', 'Commercialiser'],
  },
] as const;

const STEPS = [
  {
    title: 'Choisissez votre formation',
    body: 'Parcourez le catalogue par domaine et par niveau, et consultez le programme détaillé de chaque formation, leçon par leçon.',
  },
  {
    title: 'Inscrivez-vous',
    body: 'Les prix sont affichés dans votre devise ; le paiement se fait en euros. Votre formation rejoint aussitôt votre espace.',
  },
  {
    title: 'Apprenez à votre rythme',
    body: 'Des leçons vidéo organisées en sections, à suivre quand vous voulez depuis « Mon apprentissage ».',
  },
  {
    title: 'Passez à l’action',
    body: 'Des méthodes de praticiens du terrain, pensées pour être appliquées à vos propres opérations de négoce.',
  },
];

const SHIFTS = [
  ['La matière première', 'la valeur ajoutée'],
  ['Le producteur', 'le marché international'],
  ['Le savoir-faire', "l'opportunité"],
  ["L'Afrique", 'le monde'],
];

const FOUNDER_TITLES = [
  'Entrepreneure',
  'Investisseuse',
  'Conférencière internationale',
  'Formatrice',
  'Experte en négoce international',
];

const FOUNDER_CAREER = [
  'Promotrice d’une clinique au Cameroun',
  'Promotrice d’un centre de formation au Cameroun',
  'Associée dans une usine de fabrication de couches pour bébés au Burkina Faso',
  'Entrepreneure et investisseuse dans plusieurs secteurs d’activité',
  'Experte et formatrice en négoce des matières premières africaines',
  'Conférencière internationale : conférences et formations dans plusieurs pays africains et en Belgique',
];

const FOUNDER_COUNTRIES = ['Burkina Faso', 'Côte d’Ivoire', 'Bénin', 'Togo', 'Tanzanie', 'Guinée-Conakry', 'Cameroun'];

const FOUNDER_EVENTS: [string, string][] = [
  ['Sommet EUROPAFRIQUE', 'Parlement européen, Bruxelles'],
  ['Salon International de l’Alimentation', 'Paris'],
  ['BIOFACH', 'Allemagne'],
  ['Foire internationale de la cosmétique', 'Istanbul, Turquie'],
];

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12H19M19 12L13 6M19 12L13 18" />
    </svg>
  );
}

export default async function AboutPage() {
  const [stats, categories] = await Promise.all([cachedPlatformStats(), cachedCategories()]);

  const figures = [
    ...(stats.courses > 0 ? [{ value: stats.courses, suffix: '', label: 'Formations en ligne' }] : []),
    ...(categories.length > 0 ? [{ value: categories.length, suffix: '', label: "Domaines d'expertise" }] : []),
    { value: 500, suffix: '+', label: 'Apprenants formés' },
    { value: 25, suffix: '', label: "Pays d'opération" },
  ];

  return (
    <>
      <HomeEffects />

      {/* ========== HEADER ========== */}
      <section className={styles.header}>
        <div className="container">
          <p className={`${styles.headerLabel} ${styles.rise}`}>À propos</p>
          <h1 className={`${styles.headerTitle} ${styles.rise}`} style={{ animationDelay: '0.06s' }}>
            L&apos;académie <span>du négoce international.</span>
          </h1>
          <p className={`${styles.headerLead} ${styles.rise}`} style={{ animationDelay: '0.14s' }}>
            Proactive Académie forme celles et ceux qui veulent réussir dans le commerce international des matières
            premières africaines, avec des formations conçues par des praticiens du terrain.
          </p>

          <div className={`${styles.headerImage} ${styles.rise}`} style={{ animationDelay: '0.22s' }}>
            <Image
              src="/academy-training.jpg"
              alt="Une séance de travail de Proactive Académie"
              fill
              priority
              sizes="(max-width: 1400px) 92vw, 1300px"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <dl className={styles.figures}>
            {figures.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd className="counter-value" data-target={s.value} data-suffix={s.suffix}>
                  {s.value}
                  {s.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ========== VISION & PILLARS ========== */}
      <section className={styles.vision}>
        <div className="container">
          <p className={`${styles.visionStatement} fade-up`}>
            L&apos;Afrique ne doit pas seulement exporter ses matières premières. Elle doit les{' '}
            <em>valoriser</em>, les <em>transformer</em> et les <em>connecter</em> intelligemment aux marchés
            internationaux.
          </p>

          <div className={styles.pillars}>
            {PILLARS.map((p) => (
              <article key={p.name} className={`${styles.pillar} ${styles[p.tone]} fade-up`}>
                <h2>{p.name}</h2>
                <p>{p.body}</p>
                <ul>
                  {p.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DOMAINS ========== */}
      {categories.length > 0 && (
        <section className={styles.domains}>
          <div className="container">
            <div className={`${styles.sectionHead} fade-up`}>
              <h2>Tout le métier de négociant, domaine par domaine.</h2>
              <p>
                Du sourcing à la douane, de la finance au juridique : chaque formation couvre un pan concret des
                opérations de négoce international.
              </p>
            </div>
            <ul className={`${styles.domainList} stagger-children`}>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/courses?category=${c.slug}`} className={styles.domain}>
                    <span>{c.name}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ========== HOW IT WORKS ========== */}
      <section className={styles.how}>
        <div className="container">
          <h2 className={`${styles.howTitle} fade-up`}>Comment fonctionne l&apos;Académie.</h2>
          <ol className={`${styles.steps} stagger-children`}>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========== MISSION ========== */}
      <section className={styles.mission}>
        <div className="container">
          <h2 className={`${styles.missionTitle} fade-up`}>
            Rendre le négoce plus accessible, plus professionnel et plus structuré.
          </h2>
          <ol className={`${styles.shifts} stagger-children`}>
            {SHIFTS.map(([from, to]) => (
              <li key={from}>
                <span className={styles.shiftFrom}>{from}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
                <span className={styles.shiftTo}>{to}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========== FOUNDER ========== */}
      <section className={styles.founder}>
        <div className={`container ${styles.founderGrid}`}>
          <div className={styles.founderAside}>
            <div className={`${styles.founderPhoto} fade-up`}>
              <Image
                src="/founder-portrait.jpg"
                alt="Josette Kameni, fondatrice de Proactive Services"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
              />
            </div>
            <div className={`${styles.founderYears} fade-up`}>
              <span>40+</span>
              <p>années d’expérience entrepreneuriale entre l’Afrique et l’international</p>
            </div>
          </div>

          <div className={styles.founderCopy}>
            <div className="fade-up">
              <p className={styles.founderRole}>La fondatrice</p>
              <h2>Josette Kameni</h2>
              <ul className={styles.founderTitles}>
                {FOUNDER_TITLES.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className={styles.founderLead}>
                Plus de <strong>40 années d’expérience entrepreneuriale</strong> au service du développement des
                affaires entre l’Afrique et l’international.
              </p>
            </div>

            <div className={`${styles.founderBlock} fade-up`}>
              <h3>Son parcours entrepreneurial</h3>
              <ul className={styles.founderCareer}>
                {FOUNDER_CAREER.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div className={`${styles.founderBlock} fade-up`}>
              <h3>Une femme de terrain</h3>
              <p className={styles.founderNote}>Des missions professionnelles dans sept pays africains :</p>
              <ul className={styles.founderCountries}>
                {FOUNDER_COUNTRIES.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div className={`${styles.founderBlock} fade-up`}>
              <h3>Une expérience internationale</h3>
              <ul className={styles.founderEvents}>
                {FOUNDER_EVENTS.map(([name, place]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{place}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${styles.founderBlock} fade-up`}>
              <h3>40 années d’expérience transmises à travers ses livres</h3>
              <ul className={styles.founderBooks}>
                <li>
                  <Link href="/livres">
                    <span>Réussir en entrepreneuriat</span>
                    <Arrow />
                  </Link>
                </li>
                <li>
                  <Link href="/livres">
                    <span>La victoire d’une femme brisée</span>
                    <Arrow />
                  </Link>
                </li>
              </ul>
            </div>

            <div className={`${styles.founderMission} fade-up`}>
              <p className={styles.founderMotto}>
                Entreprendre. <span>Investir.</span> Transmettre. <span>Connecter.</span>
              </p>
              <blockquote>
                <p>
                  « L’Afrique ne doit plus seulement exporter ses matières premières. Elle doit créer de la valeur,
                  transformer et conquérir les marchés internationaux. »
                </p>
                <footer>Sa conviction</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ========== IN THE FIELD ========== */}
      <section className={styles.field}>
        <div className="container">
          <div className={`${styles.sectionHead} fade-up`}>
            <h2>Une communauté active, sur le terrain.</h2>
            <p>
              Au-delà des formations en ligne, l&apos;Académie réunit experts, apprenants et partenaires, des salles
              de formation aux salons internationaux.
            </p>
          </div>
          <FieldGallery />
        </div>
      </section>

      {/* ========== PRESS ========== */}
      <section className={styles.press}>
        <div className={`container ${styles.pressGrid}`}>
          <div className={`${styles.pressImage} fade-up`}>
            <Image
              src="/photo_2026-09-29_14-16-52.jpg"
              alt="Josette Kameni lors de son interview avec BipMedia"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={`${styles.pressCopy} fade-up`}>
            <p className={styles.pressSource}>Dans la presse · BipMedia, Belgique</p>
            <h2>Le négoce international des matières premières, raconté par notre fondatrice.</h2>
            <p>
              Dans cette interview, Josette Kameni revient sur son parcours, partage sa vision de
              l&apos;entrepreneuriat africain et livre les clés pour s&apos;imposer sur le marché international des
              matières premières.
            </p>
            <a
              href="https://www.bipmedia.be/fr/rencontre-avec-josette-kameni-experte-en-negoce-international/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.textLink}
            >
              Lire l&apos;article sur BipMedia
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className={styles.closing}>
        <div className={`container ${styles.closingInner} fade-up`}>
          <h2>Rejoignez l&apos;Académie.</h2>
          <p>
            Que vous cherchiez à vous former ou à sourcer des produits de classe mondiale, notre réseau vous ouvre ses
            portes.
          </p>
          <div className={styles.closingActions}>
            <Link href="/courses" className={styles.ctaPrimary}>
              Voir les formations
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Devenir partenaire')}`} className={styles.ctaGhost}>
              Devenir partenaire
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
