import Image from 'next/image';
import Link from 'next/link';
import type { CourseCardData } from '@/lib/db/queries/catalog';
import { formatDuration } from '@/lib/duration';
import { LEVEL_LABELS } from '@/lib/labels';
import { thumbnailUrl } from '@/lib/media';
import styles from './CourseCard.module.css';
import { Price } from './Price';
import { Stars } from './Stars';

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link href={`/courses/${course.slug}`} className={styles.card}>
      <div className={styles.thumb}>
        <Image src={thumbnailUrl(course.thumbnailPath)} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" />
      </div>
      <div className={styles.body}>
        <span className={styles.category}>{course.categoryName}</span>
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.instructor}>{course.instructorName}</p>
        {course.ratingAvg !== null && course.ratingCount > 0 ? (
          <div className={styles.rating}>
            <span className={styles.ratingValue}>{course.ratingAvg.toFixed(1)}</span>
            <Stars rating={course.ratingAvg} />
            <span className={styles.muted}>({course.ratingCount})</span>
          </div>
        ) : (
          <span className={styles.new}>Nouveau</span>
        )}
        <span className={styles.meta}>
          {formatDuration(course.totalDurationSeconds)} · {course.lessonCount} leçons · {LEVEL_LABELS[course.level]}
        </span>
        <div className={styles.footer}>
          <Price cents={course.priceCents} />
        </div>
      </div>
    </Link>
  );
}
