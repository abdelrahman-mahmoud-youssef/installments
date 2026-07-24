import { z } from 'zod';

const MAX_ID_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  phone: z.string().min(1, 'Phone number is required.').max(30),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  idImage: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_ID_IMAGE_BYTES, 'ID image must be under 4 MB.')
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      'ID image must be a PNG or JPEG image.',
    ),
});

export type CustomerInput = z.infer<typeof customerSchema>;
