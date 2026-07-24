import { z } from 'zod';

export const paymentMethodSchema = z.object({
  label: z.string().min(1, 'Enter a name.').max(100),
  details: z.string().min(1, 'Enter the account details.').max(300),
  presetKey: z.string().max(50).optional(),
  monthlyLimit: z.number().int().positive().optional(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
