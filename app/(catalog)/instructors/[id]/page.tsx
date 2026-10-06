import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CourseGrid } from '@/components/catalog/CourseGrid';
import { cachedInstructor } from '@/lib/catalog/cached';
import { avatarUrl } from '@/lib/media';
import styles from '../../catalog.module.css';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(params: PageProps<'/instructors/[id]'>['params']) {
  const { id } = await params;
  return UUID.test(id) ? cachedInstructor(id.toLowerCase()) : null;
}

export async function generateMetadata({ params }: PageProps<'/instructors/[id]'>): Promise<Metadata> {
  const p = await load(params);
  return p
    ? { title: `${p.displayName} | Formateur Proactive Académie`, description: p.headline ?? undefined }
    : { title: 'Formateur introuvable | Proactive Académie' };
}

async function InstructorView({ params }: { params: PageProps<'/instructors/[id]'>['params'] }) {
  const p = await load(params);
  if (!p) notFound();
  const avatar = avatarUrl(p.avatarPath);
  const stat = (value: string, label: string) => (
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heading)' }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>
    </div>
  );
  return (
    <>
      <header className={styles.header} style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {avatar ? (
          <Image src={avatar} alt="" width={112} height={112} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span aria-hidden="true" style={{ width: 112, height: 112, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '2.5rem', fontWeight: 700, background: 'var(--tint-emerald)', color: 'var(--on-tint-emerald)' }}>
            {p.displayName[0]}
          </span>
        )}
        <div>
          <p className="text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>Formateur</p>
          <h1 style={{ margin: '4px 0' }}>{p.displayName}</h1>
          {p.headline && <p className="text-lead" style={{ margin: 0 }}>{p.headline}</p>}
        </div>
      </header>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 32 }}>
        {stat(String(p.stats.courses), p.stats.courses > 1 ? 'formations' : 'formation')}
        {stat(String(p.stats.students), 'apprenants')}
        {p.stats.ratingAvg !== null && stat(p.stats.ratingAvg.toFixed(1), 'note moyenne')}
      </div>
      {p.bio && <p style={{ maxWidth: 760, lineHeight: 1.8, marginBottom: 48, whiteSpace: 'pre-line' }}>{p.bio}</p>}
      <h2 style={{ marginBottom: 24 }}>Formations de {p.displayName}</h2>
      <CourseGrid courses={p.courses} />
    </>
  );
}

export default function InstructorPage({ params }: PageProps<'/instructors/[id]'>) {
  return (
    <section className={styles.page}>
      <div className="container">
        <Suspense fallback={<div className={styles.skeleton} aria-busy="true" />}>
          <InstructorView params={params} />
        </Suspense>
      </div>
    </section>
  );
}
