import Image from 'next/image';
import Link from 'next/link';
import type { CourseCardData } from '@/lib/data/types';
import { formatDuration } from '@/lib/duration';
import { LEVEL_LABELS } from '@/lib/labels';
import { thumbnailUrl } from '@/lib/media';
import { plural } from '@/lib/plural';
import styles from './CourseCard.module.css';
import { Price } from './Price';
import { Stars } from './Stars';

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LessonsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M10.5 9.5v5l4-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const rated = course.ratingAvg !== null && course.ratingCount > 0;

  return (
    <Link href={`/courses/${course.slug}`} className={styles.card}>
      <div className={styles.thumb}>
        <Image
          src={thumbnailUrl(course.thumbnailPath)}
          alt=""
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
        />
        <div className={styles.chips}>
          <span className={styles.chip}>{course.categoryName}</span>
          <span className={styles.chip}>{LEVEL_LABELS[course.level]}</span>
        </div>
        <span className={styles.go} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </span>
      </div>

      <div className={styles.body}>
        {rated ? (
          <div className={styles.rating}>
            <span className={styles.ratingValue}>{course.ratingAvg!.toFixed(1)}</span>
            <Stars rating={course.ratingAvg!} />
            <span className={styles.muted}>({course.ratingCount})</span>
          </div>
        ) : (
          <span className={styles.new}>Nouveau</span>
        )}
        <h3 className={styles.title}>{course.title}</h3>

        <ul className={styles.meta}>
          <li>
            <ClockIcon />
            {formatDuration(course.totalDurationSeconds)}
          </li>
          <li>
            <LessonsIcon />
            {plural(course.lessonCount, 'leçon', 'leçons')}
          </li>
        </ul>

        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <Price cents={course.priceCents} />
            <span className={styles.instructor}>par {course.instructorName}</span>
          </div>
          <span className={styles.cta}>
            Découvrir
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
