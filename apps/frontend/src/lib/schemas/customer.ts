import { z } from 'zod';
import { imageFileSchema } from './image-file';

const MAX_ID_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  phone: z.string().min(1, 'Phone number is required.').max(30),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  photo: imageFileSchema(MAX_PHOTO_BYTES, 'Photo'),
  idImageFront: imageFileSchema(MAX_ID_IMAGE_BYTES, 'ID image'),
  idImageBack: imageFileSchema(MAX_ID_IMAGE_BYTES, 'ID image'),
});

export type CustomerInput = z.infer<typeof customerSchema>;
