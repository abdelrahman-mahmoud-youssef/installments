import { z } from 'zod';

export const paymentAllocationSchema = z.object({
  installmentId: z.string().min(1),
  amount: z.number().positive(),
});

export const paymentSchema = z.object({
  amount: z.number().positive('Enter a payment amount greater than zero.'),
  note: z.string().max(500).optional(),
  allocations: z.array(paymentAllocationSchema).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
