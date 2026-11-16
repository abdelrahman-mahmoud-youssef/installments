import { Prisma } from '@prisma/client';
import { buildActiveSubscriptionWhere } from '../../common/subscription/active-subscription-where';

export function buildReminderEligibleTenantWhere(today: Date): Prisma.TenantWhereInput {
  return { ...buildActiveSubscriptionWhere(today), isDemo: false };
}
