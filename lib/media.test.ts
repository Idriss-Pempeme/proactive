import { describe, expect, it } from 'vitest';
import { avatarUrl, thumbnailUrl } from './media';

describe('media urls', () => {
  it('passes through local public files', () => expect(thumbnailUrl('/negoce 1.jpeg')).toBe('/negoce 1.jpeg'));
  it('falls back for missing thumbnails', () => expect(thumbnailUrl(null)).toBe('/academy-training.jpg'));
  it('rejects remote and protocol-relative paths', () => {
    expect(thumbnailUrl('//evil.com/x.png')).toBe('/academy-training.jpg');
    expect(thumbnailUrl('c1/thumb.webp')).toBe('/academy-training.jpg');
    expect(avatarUrl('//evil.com/a.png')).toBeNull();
    expect(avatarUrl('u1/a.png')).toBeNull();
  });
  it('keeps local avatars and returns null without one', () => {
    expect(avatarUrl('/founder-portrait.jpg')).toBe('/founder-portrait.jpg');
    expect(avatarUrl(null)).toBeNull();
  });
});
