import { z } from 'zod';
import { RESERVED_SUBDOMAINS } from '@/lib/reserved-subdomains';

export const BRAND_COLOR_PRESETS = [
  'emerald',
  'teal',
  'blue',
  'indigo',
  'violet',
  'rose',
  'amber',
  'yellow',
  'slate',
] as const;

export type BrandColorPreset = (typeof BRAND_COLOR_PRESETS)[number];

export const brandingSchema = z.object({
  displayName: z.string().max(120),
  phone: z.string().max(30),
  brandColor: z.enum(BRAND_COLOR_PRESETS),
  showPublicPricing: z.boolean(),
});

export type BrandingInput = z.infer<typeof brandingSchema>;

export const INSTALLMENT_PLAN_MONTHS = [3, 6, 9, 12] as const;

export const ABOUT_MAX_LENGTH = 20_000;

export const shopPageSchema = z.object({
  about: z.string().max(ABOUT_MAX_LENGTH),
  instagramUrl: z.string().max(200),
  facebookUrl: z.string().max(200),
  tiktokUrl: z.string().max(200),
});

export type ShopPageInput = z.infer<typeof shopPageSchema>;

export const MAX_LOCATIONS = 10;

export const locationSchema = z.object({
  id: z.string(),
  name: z.string().max(80),
  address: z.string().min(1, 'Address is required.').max(300),
  mapUrl: z.union([z.string().max(500).url('Must be a valid URL.'), z.literal('')]),
});

export const locationsFormSchema = z.object({
  locations: z.array(locationSchema).max(MAX_LOCATIONS),
});

export type LocationInput = z.infer<typeof locationSchema>;
export type LocationsFormInput = z.infer<typeof locationsFormSchema>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const slugSchema = z.object({
  slug: z
    .string()
    .min(3, 'Must be at least 3 characters.')
    .max(60)
    .regex(SLUG_PATTERN, 'Only lowercase letters, numbers, and single hyphens.')
    .refine((value) => !RESERVED_SUBDOMAINS.has(value), 'This link is reserved and cannot be used.'),
});

export type SlugInput = z.infer<typeof slugSchema>;
