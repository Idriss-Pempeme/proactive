import type { Role } from '@/lib/db/schema';

const RANK: Record<Role, number> = { student: 0, instructor: 1, admin: 2 };

export function hasRole(actual: Role, required: Role): boolean {
  return RANK[actual] >= RANK[required];
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(next: string | null | undefined, fallback = '/learn'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  try {
    const base = 'http://local.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

const PROTECTED_PREFIXES = ['/learn', '/teach', '/admin', '/account'];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
