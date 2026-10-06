const FALLBACK_THUMBNAIL = '/academy-training.jpg';

/** Returns null when the path is unsafe or Supabase is not configured. */
function storagePublicUrl(bucket: string, path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) return null;
  const segments = path.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return null;
  return `${base}/storage/v1/object/public/${bucket}/${segments.map(encodeURIComponent).join('/')}`;
}

export function thumbnailUrl(path: string | null): string {
  if (!path) return FALLBACK_THUMBNAIL;
  if (path.startsWith('/')) return path.startsWith('//') ? FALLBACK_THUMBNAIL : path;
  return storagePublicUrl('course-media', path) ?? FALLBACK_THUMBNAIL;
}

export function avatarUrl(path: string | null): string | null {
  return path ? storagePublicUrl('avatars', path) : null;
}
