import { Prisma } from '@prisma/client';

export function buildActiveSubscriptionWhere(today: Date): Prisma.TenantWhereInput {
  return { subscriptionExpiresOn: { gt: today } };
}

export function buildExpiredSubscriptionWhere(today: Date): Prisma.TenantWhereInput {
  return { subscriptionExpiresOn: { lte: today } };
}
