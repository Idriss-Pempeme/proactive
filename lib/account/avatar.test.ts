import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, validateAvatar } from './avatar';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const HTML = new TextEncoder().encode('<html><script>');

describe('validateAvatar', () => {
  it('accepts real png, jpeg and webp', () => {
    expect(validateAvatar({ size: 100, type: 'image/png' }, PNG)).toEqual({ ok: true, ext: 'png', contentType: 'image/png' });
    expect(validateAvatar({ size: 100, type: 'image/jpeg' }, JPG)).toMatchObject({ ok: true, ext: 'jpg' });
    expect(validateAvatar({ size: 100, type: 'image/webp' }, WEBP)).toMatchObject({ ok: true, ext: 'webp' });
  });
  it('rejects empty, oversized, wrong-type and disguised files', () => {
    expect(validateAvatar({ size: 0, type: 'image/png' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: AVATAR_MAX_BYTES + 1, type: 'image/png' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/gif' }, PNG).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/png' }, HTML).ok).toBe(false);
    expect(validateAvatar({ size: 100, type: 'image/png' }, JPG).ok).toBe(false);
  });
});
