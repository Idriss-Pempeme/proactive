import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HomeEffects } from '../HomeEffects';
import { Book } from './Book';
import styles from './livres.module.css';

export const metadata: Metadata = {
  title: 'Livres | Proactive Services - Négoce · Formation · Opportunités',
  description: 'Les ouvrages de Josette Kameni : reconstruction personnelle et entrepreneuriat.',
};

const CONTACT_EMAIL = 'direction@proactiveservices.com';

const BOOKS = [
  {
    id: 'victoire',
    tone: 'ember',
    genre: 'Récit & développement personnel',
    title: "La victoire d'une femme brisée",
    subtitle: 'De victime à Boss Lady',
    desc: "Un récit sans filtre sur la reconstruction. Josette Kameni y raconte le chemin qui l'a menée de la survie à la direction de ses propres activités, sans rien arranger.",
    pages: 168,
    price: '15 €',
  },
  {
    id: 'entrepreneuriat',
    tone: 'forest',
    genre: 'Business & entrepreneuriat',
    title: 'Réussir en entrepreneuriat',
    subtitle: "Les fondations d'une activité rentable et durable",
    desc: "Un manuel de terrain pour poser les bases d'une entreprise qui tienne dans le temps : choisir son offre, fixer ses prix, aller chercher ses premiers clients et surveiller sa trésorerie.",
    pages: 192,
    price: '19 €',
  },
] as const;

function orderHref(title: string) {
  const subject = `Commande : ${title}`;
  const body = `Bonjour,\n\nJe souhaite commander le livre « ${title} » (PDF + EPUB).\n\nMerci.`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function LivresPage() {
  return (
    <>
      <HomeEffects />

      <section className={styles.intro}>
        <div className="container">
          <h1 className={`${styles.introTitle} fade-up`}>
            Les ouvrages de <span>Josette Kameni.</span>
          </h1>
          <p className={`${styles.introLead} fade-up`}>
            Deux livres, deux façons de transmettre : le récit d&apos;une reconstruction, et la méthode pour bâtir une
            activité qui dure.
          </p>
        </div>
      </section>

      {BOOKS.map((book, i) => (
        <section key={book.id} className={`${styles.bookRow} ${i % 2 ? styles.flip : ''}`}>
          <div className={`container ${styles.bookGrid}`}>
            <div className={`${styles.stage} ${styles[book.tone]} fade-up`}>
              <Book tone={book.tone} genre={book.genre} title={book.title} subtitle={book.subtitle} />
            </div>

            <div className={`${styles.bookCopy} fade-up`}>
              <p className={styles.genre}>{book.genre}</p>
              <h2 className={styles.bookTitle}>{book.title}</h2>
              <p className={styles.bookSubtitle}>{book.subtitle}</p>
              <p className={styles.bookDesc}>{book.desc}</p>

              <dl className={styles.specs}>
                <div>
                  <dt>Pages</dt>
                  <dd>{book.pages}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>PDF + EPUB</dd>
                </div>
                <div>
                  <dt>Langue</dt>
                  <dd>Français</dd>
                </div>
              </dl>

              <div className={styles.buy}>
                <span className={styles.price}>{book.price}</span>
                <a href={orderHref(book.title)} className={styles.buyBtn}>
                  Commander
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </a>
              </div>
              <p className={styles.buyNote}>La commande se fait par e-mail.</p>
            </div>
          </div>
        </section>
      ))}

      <section className={styles.author}>
        <div className={`container ${styles.authorInner} fade-up`}>
          <div className={styles.authorPhoto}>
            <Image src="/founder-portrait.jpg" alt="" fill sizes="120px" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} />
          </div>
          <div>
            <p className={styles.authorName}>Josette Kameni</p>
            <p className={styles.authorBio}>
              Quarante ans d&apos;entrepreneuriat et de négoce international, entre l&apos;Afrique, l&apos;Asie et
              l&apos;Occident.
            </p>
          </div>
          <Link href="/about" className={styles.authorLink}>
            Découvrir son parcours
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
