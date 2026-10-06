import type { CourseDetail } from '@/lib/db/queries/catalog';
import { formatDuration } from '@/lib/duration';
import { plural } from '@/lib/plural';

const sum = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

export function Curriculum({ sections }: { sections: CourseDetail['sections'] }) {
  const lessonCount = sum(sections.map((s) => s.lessons.length));
  const total = sum(sections.flatMap((s) => s.lessons.map((l) => l.durationSeconds)));
  return (
    <div className="curriculum">
      <p className="text-muted" style={{ margin: 0 }}>
        {plural(sections.length, 'section', 'sections')} · {plural(lessonCount, 'leçon', 'leçons')} · {formatDuration(total)} au total
      </p>
      {sections.map((s, i) => (
        <details key={s.id} open={i === 0} className="curriculum-section">
          <summary>
            <span>{s.title}</span>
            <span className="text-muted">
              {plural(s.lessons.length, 'leçon', 'leçons')} · {formatDuration(sum(s.lessons.map((l) => l.durationSeconds)))}
            </span>
          </summary>
          <ul>
            {s.lessons.map((l) => (
              <li key={l.id}>
                <span>{l.title}</span>
                <span className="curriculum-meta">
                  {l.isPreview && <span className="curriculum-preview">Aperçu</span>}
                  {formatDuration(l.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
