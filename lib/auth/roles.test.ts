import { describe, expect, it } from 'vitest';
import { hasRole, isProtectedPath, safeNextPath } from './roles';

describe('hasRole', () => {
  it('orders roles admin > instructor > student', () => {
    expect(hasRole('admin', 'instructor')).toBe(true);
    expect(hasRole('instructor', 'instructor')).toBe(true);
    expect(hasRole('student', 'instructor')).toBe(false);
    expect(hasRole('instructor', 'admin')).toBe(false);
    expect(hasRole('student', 'student')).toBe(true);
  });
});

describe('safeNextPath', () => {
  it('keeps same-site paths with query and hash', () => {
    expect(safeNextPath('/courses/cacao?x=1#top')).toBe('/courses/cacao?x=1#top');
  });
  it.each([
    'https://evil.com', '//evil.com', '/\\evil.com', '\\\\evil.com', 'javascript:alert(1)', 'evil.com', '', null, undefined,
    '/.//evil.com', '/..//evil.com', '/a/..//evil.com', '/./\\evil.com',
  ])('rejects %j', (value) => {
    expect(safeNextPath(value)).toBe('/learn');
  });
  it('still normalises same-site dot-segments', () => expect(safeNextPath('/courses/../learn')).toBe('/learn'));
  it('uses a custom fallback', () => expect(safeNextPath('//x', '/')).toBe('/'));
});

describe('isProtectedPath', () => {
  it.each(['/learn', '/teach/x', '/admin', '/account'])('%s is protected', (p) => expect(isProtectedPath(p)).toBe(true));
  it.each(['/', '/courses', '/learning-path', '/administration-info'])('%s is public', (p) => expect(isProtectedPath(p)).toBe(false));
});
