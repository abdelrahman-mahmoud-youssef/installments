import { z } from 'zod';

export const counterpartySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100),
  phone: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});

export type CounterpartyInput = z.infer<typeof counterpartySchema>;

export const counterpartyAdjustmentSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  amount: z.number().positive('Enter an amount greater than zero.'),
  occurredAt: z.string().min(1, 'Date is required.'),
  note: z.string().max(500).optional(),
});

export type CounterpartyAdjustmentInput = z.infer<typeof counterpartyAdjustmentSchema>;
