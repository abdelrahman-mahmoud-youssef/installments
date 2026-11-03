import { z } from 'zod';

export const supportReplySchema = z.object({
  reply: z.string().trim().min(1).max(2000),
});

export type SupportReplyInput = z.infer<typeof supportReplySchema>;
