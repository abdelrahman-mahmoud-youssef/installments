import { Prisma, PushAudience } from '@prisma/client';
import { SUBSCRIPTION_RENEWAL_NOTICE_DAYS } from '../../common/constants';
import { addUtcDays } from '../../common/date/utc-date';
import { buildExpiredSubscriptionWhere } from '../../common/subscription/active-subscription-where';

export function buildPushAudienceWhere(
  audience: PushAudience,
  tenantId: string | undefined,
  today: Date,
): Prisma.TenantWhereInput {
  switch (audience) {
    case PushAudience.EXPIRING_SOON:
      return { subscriptionExpiresOn: { gt: today, lte: addUtcDays(today, SUBSCRIPTION_RENEWAL_NOTICE_DAYS) } };
    case PushAudience.EXPIRED:
      return buildExpiredSubscriptionWhere(today);
    case PushAudience.SHOP:
      return { id: tenantId };
    case PushAudience.ALL:
      return {};
  }
}
