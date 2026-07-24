import { z } from 'zod';

export const paymentMethodTransactionSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  amount: z.number().positive('Enter an amount greater than zero.'),
  occurredAt: z.string().min(1, 'Date is required.'),
  note: z.string().max(500).optional(),
});

export type PaymentMethodTransactionInput = z.infer<typeof paymentMethodTransactionSchema>;
