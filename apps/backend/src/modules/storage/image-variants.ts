export const THUMBNAIL_WIDTHS = [200, 800] as const;

export type ThumbnailWidth = (typeof THUMBNAIL_WIDTHS)[number];

const ORIGINAL_EXTENSIONS = ['jpg', 'png'] as const;
const VARIANT_KEY_PATTERN = new RegExp(`^(.+)\\.w(${THUMBNAIL_WIDTHS.join('|')})\\.jpg$`);
const EXTENSION_PATTERN = /\.[^./]+$/;

export interface ParsedVariantKey {
  baseKey: string;
  width: ThumbnailWidth;
}

export function variantKeyFor(originalKey: string, width: ThumbnailWidth): string {
  return `${originalKey.replace(EXTENSION_PATTERN, '')}.w${width}.jpg`;
}

export function parseVariantKey(key: string): ParsedVariantKey | null {
  const match = VARIANT_KEY_PATTERN.exec(key);
  if (!match) {
    return null;
  }
  return { baseKey: match[1], width: Number(match[2]) as ThumbnailWidth };
}

export function originalKeyCandidates(baseKey: string): string[] {
  return ORIGINAL_EXTENSIONS.map((extension) => `${baseKey}.${extension}`);
}
