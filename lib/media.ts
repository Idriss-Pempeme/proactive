const FALLBACK_THUMBNAIL = '/academy-training.jpg';

function storagePublicUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function thumbnailUrl(path: string | null): string {
  if (!path) return FALLBACK_THUMBNAIL;
  if (path.startsWith('/')) return path;
  return storagePublicUrl('course-media', path);
}

export function avatarUrl(path: string | null): string | null {
  return path ? storagePublicUrl('avatars', path) : null;
}
