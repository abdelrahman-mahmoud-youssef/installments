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
  phone: z.string().max(30),
});

export type BrandingInput = z.infer<typeof brandingSchema>;

export const INSTALLMENT_PLAN_MONTHS = [3, 6, 9, 12] as const;

export const shopPageSchema = z.object({
  about: z.string().max(500),
  instagramUrl: z.string().max(200),
  facebookUrl: z.string().max(200),
  tiktokUrl: z.string().max(200),
});

export type ShopPageInput = z.infer<typeof shopPageSchema>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const slugSchema = z.object({
  slug: z
    .string()
    .min(3, 'Must be at least 3 characters.')
    .max(60)
    .regex(SLUG_PATTERN, 'Only lowercase letters, numbers, and single hyphens.'),
});

export type SlugInput = z.infer<typeof slugSchema>;
