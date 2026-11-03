import { Prisma } from '@prisma/client';
import { SubscriptionStatus } from '../../common/subscription/subscription';

export function buildSubscriptionStatusWhere(status: SubscriptionStatus, today: Date): Prisma.TenantWhereInput {
  switch (status) {
    case SubscriptionStatus.EXPIRED:
      return { subscriptionExpiresOn: { lte: today } };
    case SubscriptionStatus.ACTIVE:
      return { subscriptionExpiresOn: { gt: today }, subscriptions: { some: {} } };
    case SubscriptionStatus.TRIAL:
      return { subscriptionExpiresOn: { gt: today }, subscriptions: { none: {} } };
  }
}

export function buildTenantSearchWhere(search: string): Prisma.TenantWhereInput {
  const contains = { contains: search, mode: Prisma.QueryMode.insensitive };
  return {
    OR: [
      { name: contains },
      { displayName: contains },
      { slug: contains },
      { phone: contains },
      { users: { some: { email: contains } } },
    ],
  };
}
