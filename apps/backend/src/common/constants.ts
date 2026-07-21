export const BRAND_COLOR_PRESETS = [
  'emerald',
  'teal',
  'blue',
  'indigo',
  'violet',
  'rose',
  'amber',
  'slate',
] as const;

export type BrandColorPreset = (typeof BRAND_COLOR_PRESETS)[number];

export const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_ABOUT_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const ABOUT_MAX_LENGTH = 20_000;
