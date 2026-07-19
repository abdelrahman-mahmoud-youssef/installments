import { z } from 'zod';

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

export const brandingSchema = z.object({
  displayName: z.string().max(120),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
