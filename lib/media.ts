const FALLBACK_THUMBNAIL = '/academy-training.jpg';

/** Course thumbnails are files in /public; anything else falls back to the default image. */
export function thumbnailUrl(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return FALLBACK_THUMBNAIL;
  return path;
}

/** No uploaded avatars in the UI-only build: components show initials instead. */
export function avatarUrl(path: string | null): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
}
