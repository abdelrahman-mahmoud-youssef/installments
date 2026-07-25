import { z } from 'zod';

export const MAX_OFFER_IMAGES = 6;

const MAX_OFFER_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

const offerImageSchema = z.union([
  z.string(),
  z
    .instanceof(File)
    .refine((file) => file.size <= MAX_OFFER_IMAGE_BYTES, 'Each image must be under 5 MB.')
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), 'Images must be PNG or JPEG.'),
]);

export const offerSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional(),
  tag: z.string().max(30).optional(),
  isActive: z.boolean(),
  images: z.array(offerImageSchema).min(1, 'Add at least one image.').max(MAX_OFFER_IMAGES),
});

export type OfferInput = z.infer<typeof offerSchema>;
