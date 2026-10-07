'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import './globals.css';

// Replaces the root layout when the layout itself throws (app/error.tsx cannot catch that), so it
// renders its own <html>/<body> and imports the global styles. Same copy as app/error.tsx.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error); // Sentry replaces this in Phase 5
  }, [error]);
  return (
    <html lang="fr">
      <body>
        <title>Une erreur est survenue | Proactive Services</title>
        <main>
          <section className="section" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div className="container" style={{ maxWidth: 560 }}>
              <h1>Une erreur est survenue</h1>
              <p className="text-lead">Nous n’avons pas pu afficher cette page. Réessayez dans un instant.</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={() => retry()}>Réessayer</button>
                <Link href="/" className="btn btn-secondary">Retour à l’accueil</Link>
              </div>
              {error.digest && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 24 }}>Référence : {error.digest}</p>}
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
