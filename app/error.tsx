'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Next 16.3 error boundaries receive `retry` (re-fetches and re-renders); `reset` is the legacy no-refetch variant.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error); // Sentry replaces this in Phase 5
  }, [error]);
  return (
    <section className="section" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
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
  );
}
