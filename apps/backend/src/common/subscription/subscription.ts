import { SUBSCRIPTION_TRIAL_DAYS } from '../constants';
import { addUtcDays, addUtcMonthsClamped } from '../date/utc-date';

export const SubscriptionStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface SubscriptionPeriod {
  periodStart: Date;
  periodEnd: Date;
}

export interface SubscriptionState {
  expiresOn: Date;
  hasPaidPeriod: boolean;
}

export function isSubscriptionActive(expiresOn: Date, today: Date): boolean {
  return today.getTime() < expiresOn.getTime();
}

export function resolveSubscriptionStatus(state: SubscriptionState, today: Date): SubscriptionStatus {
  if (!isSubscriptionActive(state.expiresOn, today)) {
    return SubscriptionStatus.EXPIRED;
  }
  return state.hasPaidPeriod ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL;
}

export function calculateTrialExpiry(today: Date): Date {
  return addUtcDays(today, SUBSCRIPTION_TRIAL_DAYS);
}

export function calculateNextSubscriptionPeriod(currentExpiresOn: Date, today: Date): SubscriptionPeriod {
  const periodStart = isSubscriptionActive(currentExpiresOn, today) ? currentExpiresOn : today;
  return { periodStart, periodEnd: addUtcMonthsClamped(periodStart, 1) };
}
