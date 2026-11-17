import { Prisma } from '@prisma/client';
import { PLATFORM_EXPIRING_SOON_DAYS } from '../../common/constants';
import { addUtcDays } from '../../common/date/utc-date';
import {
  buildActiveSubscriptionWhere,
  buildExpiredSubscriptionWhere,
} from '../../common/subscription/active-subscription-where';
import { SubscriptionStatus } from '../../common/subscription/subscription';

export const PlatformTenantFilter = {
  ...SubscriptionStatus,
  EXPIRING_SOON: 'EXPIRING_SOON',
  NEVER_PAID: 'NEVER_PAID',
} as const;

export type PlatformTenantFilter = (typeof PlatformTenantFilter)[keyof typeof PlatformTenantFilter];

export function buildTenantFilterWhere(filter: PlatformTenantFilter, today: Date): Prisma.TenantWhereInput {
  switch (filter) {
    case PlatformTenantFilter.EXPIRED:
      return buildExpiredSubscriptionWhere(today);
    case PlatformTenantFilter.ACTIVE:
      return { ...buildActiveSubscriptionWhere(today), subscriptions: { some: {} } };
    case PlatformTenantFilter.TRIAL:
      return { ...buildActiveSubscriptionWhere(today), subscriptions: { none: {} } };
    case PlatformTenantFilter.EXPIRING_SOON:
      return { subscriptionExpiresOn: { gt: today, lte: addUtcDays(today, PLATFORM_EXPIRING_SOON_DAYS) } };
    case PlatformTenantFilter.NEVER_PAID:
      return { subscriptions: { none: {} } };
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
