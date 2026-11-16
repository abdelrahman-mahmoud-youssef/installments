import { PushNotificationKind } from '@prisma/client';
import {
  SUBSCRIPTION_PUSH_DAYS_AFTER_EXPIRY,
  SUBSCRIPTION_PUSH_DAYS_BEFORE_EXPIRY,
} from '../../common/constants';
import { addUtcDays } from '../../common/date/utc-date';

export type SubscriptionPushKind = 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED';

interface SubscriptionPushMilestone {
  kind: SubscriptionPushKind;
  expiryOffsetDays: number;
}

export const SUBSCRIPTION_PUSH_MILESTONES: readonly SubscriptionPushMilestone[] = [
  { kind: PushNotificationKind.SUBSCRIPTION_EXPIRING, expiryOffsetDays: SUBSCRIPTION_PUSH_DAYS_BEFORE_EXPIRY },
  { kind: PushNotificationKind.SUBSCRIPTION_EXPIRED, expiryOffsetDays: -SUBSCRIPTION_PUSH_DAYS_AFTER_EXPIRY },
];

export function resolveExpiryDateForMilestone(milestone: SubscriptionPushMilestone, today: Date): Date {
  return addUtcDays(today, milestone.expiryOffsetDays);
}

export function buildSubscriptionPushDedupeKey(kind: SubscriptionPushKind, tenantId: string, expiresOn: Date): string {
  return `${kind}:${tenantId}:${expiresOn.toISOString().slice(0, 10)}`;
}
