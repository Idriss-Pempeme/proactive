export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
type Ext = (typeof TYPES)[keyof typeof TYPES];

const startsWith = (head: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => head[offset + i] === b);

function matchesSignature(ext: Ext, head: Uint8Array): boolean {
  switch (ext) {
    case 'jpg': return startsWith(head, [0xff, 0xd8, 0xff]);
    case 'png': return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'webp': return startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8);
  }
}

export function validateAvatar(
  meta: { size: number; type: string },
  head: Uint8Array,
): { ok: true; ext: Ext; contentType: string } | { ok: false; error: string } {
  if (meta.size === 0) return { ok: false, error: 'Le fichier est vide.' };
  if (meta.size > AVATAR_MAX_BYTES) return { ok: false, error: 'Image trop lourde (2 Mo maximum).' };
  const ext = TYPES[meta.type as keyof typeof TYPES];
  if (!ext) return { ok: false, error: 'Formats acceptés : JPG, PNG ou WebP.' };
  if (!matchesSignature(ext, head)) return { ok: false, error: 'Le fichier n’est pas une image valide.' };
  return { ok: true, ext, contentType: meta.type };
}
