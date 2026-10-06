import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Curriculum } from '@/components/catalog/Curriculum';
import { Price } from '@/components/catalog/Price';
import { PurchaseCta } from '@/components/catalog/PurchaseCta';
import { Stars } from '@/components/catalog/Stars';
import { cachedCourse } from '@/lib/catalog/cached';
import { formatDuration } from '@/lib/duration';
import { LEVEL_LABELS } from '@/lib/labels';
import { renderMarkdown } from '@/lib/markdown';
import { avatarUrl, thumbnailUrl } from '@/lib/media';
import styles from './course.module.css';

const SLUG = /^[a-z0-9-]{1,120}$/;
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

async function loadCourse(params: PageProps<'/courses/[slug]'>['params']) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return null; // junk URLs must not create cache entries
  return cachedCourse(slug);
}

export async function generateMetadata({ params }: PageProps<'/courses/[slug]'>): Promise<Metadata> {
  const course = await loadCourse(params);
  if (!course) return { title: 'Formation introuvable | Proactive Académie' };
  return {
    title: `${course.title} | Proactive Académie`,
    description: course.subtitle,
    openGraph: { title: course.title, description: course.subtitle, images: [thumbnailUrl(course.thumbnailPath)] },
  };
}

async function CourseView({ params }: { params: PageProps<'/courses/[slug]'>['params'] }) {
  const course = await loadCourse(params);
  if (!course) notFound();
  const avatar = avatarUrl(course.instructor.avatarPath);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <nav className={styles.crumbs} aria-label="Fil d’Ariane">
              <Link href="/courses">Formations</Link> › <Link href={`/courses?category=${course.categorySlug}`}>{course.categoryName}</Link>
            </nav>
            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.subtitle}>{course.subtitle}</p>
            <div className={styles.facts}>
              {course.ratingAvg !== null && course.ratingCount > 0 ? (
                <span>
                  <strong style={{ color: 'var(--rating-star)' }}>{course.ratingAvg.toFixed(1)}</strong> <Stars rating={course.ratingAvg} /> ({course.ratingCount} avis)
                </span>
              ) : (
                <span>Nouvelle formation</span>
              )}
              {course.enrollmentCount > 0 && <span>{course.enrollmentCount} apprenants</span>}
              <span>Par <Link href={`/instructors/${course.instructor.id}`}>{course.instructor.displayName}</Link></span>
              <span>{LEVEL_LABELS[course.level]}</span>
              <span>{formatDuration(course.totalDurationSeconds)} · {course.lessonCount} leçons</span>
              <span>Mise à jour : {monthYear.format(course.updatedAt)}</span>
              <span>Français</span>
            </div>
          </div>
          <aside className={styles.card} aria-label="Inscription">
            <div className={styles.cardMedia}>
              <Image src={thumbnailUrl(course.thumbnailPath)} alt="" fill sizes="(max-width: 1024px) 100vw, 360px" preload />
            </div>
            <div className={styles.cardBody}>
              <Price cents={course.priceCents} size="lg" />
              <Suspense fallback={<div style={{ height: 48 }} />}>
                <PurchaseCta courseId={course.id} slug={course.slug} priceCents={course.priceCents} />
              </Suspense>
              <ul className="text-muted" style={{ fontSize: '0.875rem', paddingLeft: 18, margin: 0 }}>
                <li>Accès illimité</li>
                <li>Certificat de réussite</li>
                <li>Paiement en euros</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.content}>
        <div className={`container ${styles.main}`}>
          {course.outcomes.length > 0 && (
            <div className={styles.block}>
              <h2>Ce que vous apprendrez</h2>
              <ul className={styles.outcomes}>{course.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
          <div className={styles.block}>
            <h2>Programme</h2>
            <Curriculum sections={course.sections} />
          </div>
          {course.requirements.length > 0 && (
            <div className={styles.block}>
              <h2>Prérequis</h2>
              <ul>{course.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
          <div className={styles.block}>
            <h2>Description</h2>
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(course.description) }} />
          </div>
          <div className={styles.block}>
            <h2>Votre formateur</h2>
            <div className={styles.instructor}>
              {avatar ? (
                <Image src={avatar} alt="" width={72} height={72} className={styles.avatar} />
              ) : (
                <span className={styles.avatar} aria-hidden="true">{course.instructor.displayName[0]}</span>
              )}
              <div>
                <Link href={`/instructors/${course.instructor.id}`}><strong>{course.instructor.displayName}</strong></Link>
                {course.instructor.headline && <p className="text-muted" style={{ margin: '4px 0' }}>{course.instructor.headline}</p>}
                {course.instructor.bio && <p style={{ margin: 0 }}>{course.instructor.bio}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CoursePage({ params }: PageProps<'/courses/[slug]'>) {
  return (
    <Suspense fallback={<div className={styles.hero} style={{ minHeight: 420 }} aria-busy="true" />}>
      <CourseView params={params} />
    </Suspense>
  );
}
