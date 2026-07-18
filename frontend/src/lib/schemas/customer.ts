import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  phone: z.string().min(1, 'Phone number is required.').max(30),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
