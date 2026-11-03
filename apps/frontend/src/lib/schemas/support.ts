import { z } from 'zod';
import { imageFileSchema } from './image-file';

const MAX_SUPPORT_IMAGE_BYTES = 4 * 1024 * 1024;

export const supportMessageSchema = z.object({
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
  image: imageFileSchema(MAX_SUPPORT_IMAGE_BYTES, 'Image'),
});

export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
