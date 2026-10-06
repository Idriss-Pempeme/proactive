import Link from 'next/link';
import { enrollFreeAction } from '@/app/(catalog)/courses/[slug]/actions';
import { getProfile } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { isEnrolled } from '@/lib/db/queries/enrollment';

const full = { width: '100%', justifyContent: 'center' } as const;

export async function PurchaseCta({ courseId, slug, priceCents }: { courseId: string; slug: string; priceCents: number }) {
  const profile = await getProfile();
  if (!profile) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn btn-primary" style={full}>
        Se connecter pour s’inscrire
      </Link>
    );
  }
  if (await isEnrolled(db, profile.id, courseId)) {
    return (
      <div role="status">
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--emerald-light)' }}>Vous êtes inscrit à cette formation.</p>
        <Link href="/learn" className="btn btn-secondary" style={full}>Mon apprentissage</Link>
      </div>
    );
  }
  if (priceCents === 0) {
    return (
      <form action={enrollFreeAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <button className="btn btn-primary" style={full}>S’inscrire gratuitement</button>
      </form>
    );
  }
  return (
    <>
      <button className="btn btn-primary" disabled aria-describedby="pay-soon" style={full}>Acheter</button>
      <p id="pay-soon" className="text-muted" style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>Paiement en ligne bientôt disponible.</p>
    </>
  );
}
