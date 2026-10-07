import type { CourseCardData } from '@/lib/data/types';
import { CourseCard } from './CourseCard';
import styles from './CourseCard.module.css';

export function CourseGrid({ courses }: { courses: CourseCardData[] }) {
  return (
    <ul className={styles.grid} role="list">
      {courses.map((c) => (
        <li key={c.id}>
          <CourseCard course={c} />
        </li>
      ))}
    </ul>
  );
}
