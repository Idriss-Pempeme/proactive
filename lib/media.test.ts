import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarUrl, thumbnailUrl } from './media';

afterEach(() => vi.unstubAllEnvs());

describe('media urls', () => {
  it('passes through local public files', () => expect(thumbnailUrl('/negoce 1.jpeg')).toBe('/negoce 1.jpeg'));
  it('falls back for missing thumbnails', () => expect(thumbnailUrl(null)).toBe('/academy-training.jpg'));
  it('builds storage URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    expect(thumbnailUrl('c1/thumb.webp')).toBe('https://abc.supabase.co/storage/v1/object/public/course-media/c1/thumb.webp');
    expect(avatarUrl('u1/a.png')).toBe('https://abc.supabase.co/storage/v1/object/public/avatars/u1/a.png');
    expect(avatarUrl(null)).toBeNull();
  });
  it('rejects protocol-relative and traversal paths', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    expect(thumbnailUrl('//evil.com/x.png')).toBe('/academy-training.jpg');
    expect(thumbnailUrl('a/../b.png')).toBe('/academy-training.jpg');
    expect(thumbnailUrl('./x.png')).toBe('/academy-training.jpg');
    expect(thumbnailUrl('a//b.png')).toBe('/academy-training.jpg');
    expect(avatarUrl('a/../b.png')).toBeNull();
    expect(avatarUrl('./x.png')).toBeNull();
  });
  it('falls back when the Supabase URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(thumbnailUrl('c1/thumb.webp')).toBe('/academy-training.jpg');
    expect(avatarUrl('u1/a.png')).toBeNull();
  });
});
