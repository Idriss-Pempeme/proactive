import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { HomeEffects } from '../HomeEffects';
import { Book } from './Book';
import styles from './livres.module.css';

export const metadata: Metadata = {
  title: 'Livres | Proactive Services - Négoce · Formation · Opportunités',
  description:
    'Les ouvrages de Josette Kameni : réussir sa vie de couple et se relever des épreuves, réussir en entrepreneuriat.',
};

const BOOKS = [
  {
    id: 'victoire',
    tone: 'ember',
    genre: 'Témoignage & vie de couple',
    title: "La victoire d'une femme brisée",
    subtitle: 'De victime à Boss Lady',
    tagline: 'Le guide pour réussir sa relation, son mariage et sa vie de couple',
    desc: [
      'Un ouvrage de témoignage, de réflexion et de conseils consacré aux relations amoureuses, au mariage et aux épreuves de la vie de couple.',
      "Contrairement à ce que son titre pourrait laisser penser, il ne s'adresse pas uniquement aux femmes : hommes, femmes et couples y trouveront de quoi mieux comprendre les relations et faire de meilleurs choix avant de s'engager.",
    ],
    points: [
      'Bien choisir son partenaire avant de dire « oui »',
      'Reconnaître les signes d’une relation qui devient toxique',
      'Comprendre le rôle et les responsabilités de chacun dans le couple',
      'Traverser une crise, une séparation ou un divorce, et se reconstruire',
    ],
    pages: 156,
    format: 'PDF',
    price: '8,80 $US',
    url: 'https://lgfgterv.mychariow.shop/prd_crt48dup',
  },
  {
    id: 'entrepreneuriat',
    tone: 'forest',
    genre: 'Business & entrepreneuriat',
    title: 'Réussir en entrepreneuriat',
    subtitle: 'Étapes clés et conseils pratiques',
    tagline: 'Transformez vos ambitions en succès entrepreneurial',
    desc: [
      "Créer une entreprise, développer une activité rentable, surmonter les obstacles et atteindre l'indépendance financière : Josette Kameni partage les leçons tirées de plus de trois décennies dans le monde des affaires.",
      'Un véritable guide de terrain pour éviter les erreurs les plus fréquentes, renforcer votre vision et accélérer votre réussite.',
    ],
    points: [
      "Les fondements d'un entrepreneuriat réussi",
      'Les étapes essentielles pour démarrer et développer son activité',
      'Les clés de la résilience face aux difficultés',
      "Les stratégies pour créer de la valeur et saisir les opportunités",
    ],
    pages: 114,
    format: 'PDF',
    price: '8,80 $US',
    url: 'https://lgfgterv.mychariow.shop/prd_s50b6h6v',
  },
] as const;

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
            Deux livres, deux façons de transmettre : réussir sa vie de couple et se relever des épreuves, et la
            méthode pour bâtir une activité qui dure.
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
              <p className={styles.tagline}>{book.tagline}</p>
              {book.desc.map((para) => (
                <p key={para} className={styles.bookDesc}>{para}</p>
              ))}
              <ul className={styles.points}>
                {book.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <dl className={styles.specs}>
                <div>
                  <dt>Pages</dt>
                  <dd>{book.pages}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{book.format}</dd>
                </div>
                <div>
                  <dt>Langue</dt>
                  <dd>Français</dd>
                </div>
              </dl>

              <div className={styles.buy}>
                <span className={styles.price}>{book.price}</span>
                <a href={book.url} target="_blank" rel="noopener noreferrer" className={styles.buyBtn}>
                  Télécharger le livre
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </a>
              </div>
              <p className={styles.buyNote}>Offre à durée limitée. Paiement sécurisé et téléchargement immédiat sur la boutique de Josette Kameni.</p>
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
