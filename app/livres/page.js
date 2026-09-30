"use client";

import { useScrollAnimations } from '../hooks';

const BOOKS = [
  {
    id: 'victoire',
    kicker: 'RÉCIT & DÉVELOPPEMENT PERSONNEL',
    coverTitle: "La victoire d'une femme brisée",
    coverSub: 'De victime à Boss Lady',
    cover: 'linear-gradient(135deg, #d15200, #802f00)',
    coverBorder: '1px solid #ff7b00',
    pages: '168 pages',
    pagesStyle: { backgroundColor: 'var(--tint-gold)', color: 'var(--on-tint-gold)' },
    title: "La victoire d'une femme brisée",
    desc: "Un récit sans filtre sur la reconstruction. Josette KAMENI y raconte le chemin qui l'a menée de la survie à la direction de ses propres activités, sans rien arranger : les ruptures, les échecs, les...",
    price: '15 €'
  },
  {
    id: 'entrepreneuriat',
    kicker: 'BUSINESS & ENTREPRENEURIAT',
    coverTitle: 'Réussir en entrepreneuriat',
    coverSub: "Les fondations d'une activité rentable et durable",
    cover: 'linear-gradient(135deg, #0b5e40, #04291b)',
    coverBorder: '1px solid var(--emerald-main)',
    pages: '192 pages',
    pagesStyle: { backgroundColor: 'var(--tint-emerald)', color: 'var(--on-tint-emerald)' },
    title: 'Réussir en entrepreneuriat',
    desc: "Un manuel de terrain pour poser les bases d'une entreprise qui tienne dans le temps : choisir son offre, fixer ses prix, aller chercher ses premiers clients, surveiller sa trésorerie, puis structurer...",
    price: '19 €'
  }
];

export default function LivresPage() {
  useScrollAnimations();

  return (
    <>
      <section className="section livres-section">
        <div className="container">
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 60px)' }}>
            <h1 style={{ fontSize: 'clamp(2.25rem, 7vw, 4rem)', marginBottom: '20px' }}>
              Nos <span style={{ color: 'var(--gold-main)' }}>Ouvrages.</span>
            </h1>
            <p className="text-lead" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Découvrez les méthodes et stratégies exclusives de Josette Kameni compilées dans nos best-sellers pour maîtriser l'export.
            </p>
          </div>

          <div className="books-grid">
            {BOOKS.map((book, index) => (
              <div key={book.id} className="book-card fade-up" style={{ transitionDelay: index * 0.2 + 's' }}>
                <div className="book-cover-wrapper">
                  <div className="book-cover" style={{ background: book.cover, border: book.coverBorder }}>
                    <div className="book-spine"></div>
                    <h4 className="book-cover-kicker">{book.kicker}</h4>
                    <h3 className="book-cover-title">{book.coverTitle}</h3>
                    <p className="book-cover-sub">{book.coverSub}</p>
                    <p className="book-cover-author">Josette Kameni</p>
                  </div>
                </div>

                <div className="book-info">
                  <div>
                    <div className="book-chips">
                      <span className="book-chip" style={book.pagesStyle}>{book.pages}</span>
                      <span className="book-chip">PDF + EPUB</span>
                      <span className="book-chip">Français</span>
                    </div>

                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-desc">{book.desc}</p>
                  </div>

                  <div className="book-footer">
                    <span className="book-price">{book.price}</span>
                    <div className="book-actions">
                      <button className="btn book-btn book-btn-ghost">Détails</button>
                      <button className="btn book-btn book-btn-buy">Acheter</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .livres-section {
            position: relative;
            padding-top: calc(var(--nav-height) + clamp(48px, 9vw, 110px));
            min-height: 100svh;
          }
          .books-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
            gap: clamp(24px, 4vw, 40px);
            max-width: 1000px;
            margin: 0 auto;
          }
          .book-card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
          }
          .book-cover-wrapper {
            width: 100%;
            height: clamp(260px, 42vw, 320px);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--book-stage);
            border-bottom: 1px solid var(--border-subtle);
            perspective: 1200px;
          }
          .book-cover {
            width: clamp(150px, 34vw, 180px);
            height: clamp(210px, 46vw, 250px);
            border-radius: 4px 12px 12px 4px;
            box-shadow: 15px 15px 30px rgba(0, 0, 0, 0.45), inset 4px 0 10px rgba(0, 0, 0, 0.6);
            padding: 20px;
            display: flex;
            flex-direction: column;
            transform: rotateY(-20deg) rotateX(5deg);
            transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease;
            position: relative;
          }
          .book-spine {
            position: absolute;
            top: 0;
            left: 10px;
            bottom: 0;
            width: 2px;
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.5);
          }
          /* The jackets keep their printed colours in both themes, so their
             own type stays white regardless of the page theme. */
          .book-cover-kicker {
            color: rgba(255, 255, 255, 0.88);
            font-size: 0.55rem;
            font-family: 'Outfit', sans-serif;
            margin-top: 5px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            line-height: 1.4;
          }
          .book-cover-title {
            color: #fff;
            font-size: 1.25rem;
            margin-top: 15px;
            line-height: 1.1;
          }
          .book-cover-sub {
            color: rgba(255, 255, 255, 0.92);
            font-size: 0.75rem;
            margin-top: 8px;
            line-height: 1.2;
          }
          .book-cover-author {
            margin-top: auto;
            color: rgba(255, 255, 255, 0.88);
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: bold;
          }
          .book-info {
            padding: clamp(20px, 3vw, 30px);
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          }
          .book-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
          }
          .book-chip {
            display: inline-block;
            background-color: var(--chip-bg);
            color: var(--chip-fg);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
          }
          .book-title {
            font-size: clamp(1.25rem, 3vw, 1.5rem);
            margin-bottom: 10px;
            font-family: 'Playfair Display', serif;
          }
          .book-desc {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .book-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
          }
          .book-price {
            font-size: 1.75rem;
            font-weight: 800;
            color: var(--text-main);
          }
          .book-actions {
            display: flex;
            gap: 10px;
          }
          .book-btn {
            min-height: 44px;
            padding: 8px 22px;
            font-size: 0.9rem;
            border-radius: 6px;
          }
          .book-btn-ghost {
            background-color: transparent;
            border: 1px solid var(--border-highlight);
            color: var(--text-main);
          }
          .book-btn-buy {
            background-color: var(--book-cta);
            color: #fff;
            border: none;
          }

          @media (hover: hover) {
            .book-card:hover {
              transform: translateY(-8px);
              background: var(--bg-card-hover);
              border-color: var(--border-highlight);
            }
            .book-card:hover .book-cover {
              transform: rotateY(-5deg) rotateX(0deg) scale(1.08);
              box-shadow: 20px 20px 40px rgba(0, 0, 0, 0.55), inset 4px 0 10px rgba(0, 0, 0, 0.6);
            }
            .book-btn-ghost:hover {
              border-color: var(--gold-main);
              color: var(--gold-main);
            }
          }

          @media (max-width: 420px) {
            .book-footer {
              flex-direction: column;
              align-items: stretch;
            }
            .book-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </section>
    </>
  );
}
