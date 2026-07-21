import { z } from 'zod';

const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const ACCEPTED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg'];

export const paymentClaimSchema = z.object({
  paymentMethodId: z.string().min(1, 'Choose a payment method.'),
  screenshot: z
    .instanceof(File, { message: 'Attach a screenshot.' })
    .refine((file) => file.size <= MAX_SCREENSHOT_BYTES, 'Screenshot must be under 4 MB.')
    .refine(
      (file) => ACCEPTED_SCREENSHOT_TYPES.includes(file.type),
      'Screenshot must be a PNG or JPEG image.',
    ),
});

export type PaymentClaimInput = z.infer<typeof paymentClaimSchema>;
