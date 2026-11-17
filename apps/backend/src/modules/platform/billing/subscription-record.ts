import { Prisma } from '@prisma/client';

const ITEM_NAME_SELECT = { select: { nameEn: true, nameAr: true } } as const;

export const SUBSCRIPTION_RECORD_SELECT = {
  id: true,
  periodStart: true,
  periodEnd: true,
  months: true,
  source: true,
  plan: ITEM_NAME_SELECT,
  offer: ITEM_NAME_SELECT,
  listPrice: true,
  amount: true,
  paidAt: true,
  paymentMethod: true,
  reference: true,
  note: true,
  createdAt: true,
  activatedBy: { select: { name: true } },
} satisfies Prisma.TenantSubscriptionSelect;

export type SubscriptionRecord = Prisma.TenantSubscriptionGetPayload<{ select: typeof SUBSCRIPTION_RECORD_SELECT }>;
