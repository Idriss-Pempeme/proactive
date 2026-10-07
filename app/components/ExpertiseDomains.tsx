import Image from 'next/image';
import Link from 'next/link';
import styles from './ExpertiseDomains.module.css';

const DOMAINS = [
  { title: 'Import-Export', sub: 'Fondamentaux et opérations', href: '/courses?category=import-export', img: '/trading-port.jpg' },
  { title: 'Développement commercial', sub: 'Prospection internationale', href: '/courses', img: '/photo_2026-09-29_14-16-59.jpg' },
  { title: 'Opportunités économiques', sub: 'Repérer les marchés porteurs', href: '/courses', img: '/hero-commodities.jpg' },
  { title: 'Foires internationales', sub: 'Préparer et rentabiliser', href: '/courses', img: '/photo_2026-09-29_14-16-58.jpg' },
  { title: 'Agriculture biologique', sub: 'Bio, certification et traçabilité', href: '/courses?category=agriculture', img: '/africa-landscape.jpg' },
  { title: 'Commerce équitable', sub: 'Filières et labels', href: '/courses', img: '/warehouse-premium.jpg' },
];

/** "Nos domaines d’expertise": an editorial index of the six specialities, each opening the catalogue. */
export function ExpertiseDomains() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <div className={`${styles.intro} fade-up`}>
          <h2>
            Nos domaines <span>d’expertise.</span>
          </h2>
          <p>Des spécialités du négoce et du commerce international, qui se complètent.</p>
          <Link href="/courses" className={styles.all}>
            Voir le catalogue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>

        <ul className={`${styles.list} stagger-children`}>
          {DOMAINS.map((d) => (
            <li key={d.title}>
              <Link href={d.href} className={styles.row}>
                <span className={styles.thumb} aria-hidden="true">
                  <Image src={d.img} alt="" fill sizes="96px" />
                </span>
                <span className={styles.text}>
                  <span className={styles.title}>{d.title}</span>
                  <span className={styles.sub}>{d.sub}</span>
                </span>
                <span className={styles.go} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
