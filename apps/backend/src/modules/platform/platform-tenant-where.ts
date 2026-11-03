import { Prisma } from '@prisma/client';
import {
  buildActiveSubscriptionWhere,
  buildExpiredSubscriptionWhere,
} from '../../common/subscription/active-subscription-where';
import { SubscriptionStatus } from '../../common/subscription/subscription';

export function buildSubscriptionStatusWhere(status: SubscriptionStatus, today: Date): Prisma.TenantWhereInput {
  switch (status) {
    case SubscriptionStatus.EXPIRED:
      return buildExpiredSubscriptionWhere(today);
    case SubscriptionStatus.ACTIVE:
      return { ...buildActiveSubscriptionWhere(today), subscriptions: { some: {} } };
    case SubscriptionStatus.TRIAL:
      return { ...buildActiveSubscriptionWhere(today), subscriptions: { none: {} } };
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
