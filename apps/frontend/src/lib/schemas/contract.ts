import { z } from 'zod';
import { CALCULATION_METHODS, RECURRENCE_TYPES } from '@/lib/enums';

const MAX_CONTRACT_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export const contractSchema = z
  .object({
    customerId: z.string().min(1, 'Select a customer.'),
    productName: z.string().min(1, 'Product name is required.').max(200),
    productPrice: z.number().positive('Product price must be greater than zero.'),
    costPrice: z.number().min(0, 'Cost price cannot be negative.').optional(),
    downPayment: z.number().min(0, 'Down payment cannot be negative.').optional(),
    calculationMethod: z.enum(CALCULATION_METHODS),
    markupPercent: z.number().positive().optional(),
    installmentCount: z.number().int().positive().optional(),
    fixedInstallmentAmount: z.number().positive().optional(),
    recurrenceType: z.enum(RECURRENCE_TYPES),
    intervalDays: z.number().int().positive().optional(),
    startDate: z.string().min(1, 'Start date is required.'),
    firstPaymentDate: z.string().min(1, 'First payment date is required.'),
    image: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || file.size <= MAX_CONTRACT_IMAGE_BYTES, 'Image must be under 5 MB.')
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Image must be a PNG or JPEG image.',
      ),
  })
  .superRefine((data, ctx) => {
    if (data.calculationMethod === 'MARKUP_PERCENT' && !data.markupPercent) {
      ctx.addIssue({ code: 'custom', path: ['markupPercent'], message: 'Markup percentage is required.' });
    }
    if (
      (data.calculationMethod === 'FIXED_COUNT' || data.calculationMethod === 'MARKUP_PERCENT') &&
      !data.installmentCount
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['installmentCount'],
        message: 'Number of installments is required.',
      });
    }
    if (data.calculationMethod === 'FIXED_AMOUNT' && !data.fixedInstallmentAmount) {
      ctx.addIssue({
        code: 'custom',
        path: ['fixedInstallmentAmount'],
        message: 'Fixed installment amount is required.',
      });
    }
    if (data.recurrenceType === 'EVERY_X_DAYS' && !data.intervalDays) {
      ctx.addIssue({ code: 'custom', path: ['intervalDays'], message: 'Interval in days is required.' });
    }
  });

export type ContractInput = z.infer<typeof contractSchema>;
