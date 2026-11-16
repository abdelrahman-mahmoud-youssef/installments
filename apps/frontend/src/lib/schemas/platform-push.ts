import { z } from 'zod';

const PUSH_TITLE_MAX_LENGTH = 100;
const PUSH_BODY_MAX_LENGTH = 300;

export const platformPushSchema = z
  .object({
    title: z.string().trim().min(1).max(PUSH_TITLE_MAX_LENGTH),
    body: z.string().trim().min(1).max(PUSH_BODY_MAX_LENGTH),
    audience: z.enum(['ALL', 'EXPIRING_SOON', 'EXPIRED', 'SHOP']),
    tenantId: z.string().optional(),
  })
  .refine((values) => values.audience !== 'SHOP' || Boolean(values.tenantId), { path: ['tenantId'] });

export type PlatformPushInput = z.infer<typeof platformPushSchema>;
