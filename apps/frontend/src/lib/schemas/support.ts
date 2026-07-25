import { z } from 'zod';

export const supportMessageSchema = z.object({
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
});

export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
