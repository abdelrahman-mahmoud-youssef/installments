import { z } from 'zod';

const MAX_RECEIPT_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export const paymentMethodTransactionSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  amount: z.number().positive('Enter an amount greater than zero.'),
  occurredAt: z.string().min(1, 'Date is required.'),
  counterpartyId: z.string().optional(),
  counterpartyName: z.string().max(100).optional(),
  counterpartyPhone: z.string().max(30).optional(),
  note: z.string().max(500).optional(),
  image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_RECEIPT_IMAGE_BYTES, 'Image must be under 5 MB.')
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Image must be a PNG or JPEG image.',
    ),
});

export type PaymentMethodTransactionInput = z.infer<typeof paymentMethodTransactionSchema>;
