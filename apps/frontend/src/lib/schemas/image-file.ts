import { z } from 'zod';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export function imageFileSchema(maxBytes: number, label: string) {
  return z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= maxBytes, `${label} must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), `${label} must be a PNG or JPEG image.`);
}
