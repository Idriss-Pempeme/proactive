import Link from 'next/link';

const full = { width: '100%', justifyContent: 'center' } as const;

/** UI-only build: visitors are signed out, so the course page invites them to log in. */
export function PurchaseCta({ slug }: { courseId: string; slug: string; priceCents: number }) {
  return (
    <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`} className="btn btn-primary" style={full}>
      Se connecter pour s’inscrire
    </Link>
  );
}
