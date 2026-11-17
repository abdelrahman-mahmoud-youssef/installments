import { z } from 'zod';
import { WALLET_ACCESS_LEVELS } from '@/lib/enums';

export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const staffWalletAccessSchema = z
  .object({
    walletAccess: z.enum(WALLET_ACCESS_LEVELS),
    paymentMethodIds: z.array(z.string()),
  })
  .refine((data) => data.walletAccess !== 'SELECTED' || data.paymentMethodIds.length > 0, {
    path: ['paymentMethodIds'],
    message: 'Select at least one wallet.',
  });

export type StaffWalletAccessInput = z.infer<typeof staffWalletAccessSchema>;
