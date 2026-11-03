import { SUBSCRIPTION_RENEWAL_NOTICE_DAYS, SUBSCRIPTION_TRIAL_DAYS } from '../constants';
import { addUtcDays, addUtcMonthsClamped, differenceInUtcDays } from '../date/utc-date';

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

export interface SubscriptionSummary {
  status: SubscriptionStatus;
  expiresOn: Date;
  daysRemaining: number;
  isRenewalDueSoon: boolean;
}

export function isSubscriptionActive(expiresOn: Date, today: Date): boolean {
  return today.getTime() < expiresOn.getTime();
}

export function calculateDaysRemaining(expiresOn: Date, today: Date): number {
  return Math.max(0, differenceInUtcDays(expiresOn, today));
}

export function isRenewalDueSoon(expiresOn: Date, today: Date): boolean {
  const daysRemaining = calculateDaysRemaining(expiresOn, today);
  return daysRemaining > 0 && daysRemaining <= SUBSCRIPTION_RENEWAL_NOTICE_DAYS;
}

export function resolveSubscriptionStatus(state: SubscriptionState, today: Date): SubscriptionStatus {
  if (!isSubscriptionActive(state.expiresOn, today)) {
    return SubscriptionStatus.EXPIRED;
  }
  return state.hasPaidPeriod ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL;
}

export function summarizeSubscription(state: SubscriptionState, today: Date): SubscriptionSummary {
  return {
    status: resolveSubscriptionStatus(state, today),
    expiresOn: state.expiresOn,
    daysRemaining: calculateDaysRemaining(state.expiresOn, today),
    isRenewalDueSoon: isRenewalDueSoon(state.expiresOn, today),
  };
}

export function calculateTrialExpiry(today: Date): Date {
  return addUtcDays(today, SUBSCRIPTION_TRIAL_DAYS);
}

export function calculateNextSubscriptionPeriod(currentExpiresOn: Date, today: Date): SubscriptionPeriod {
  const periodStart = isSubscriptionActive(currentExpiresOn, today) ? currentExpiresOn : today;
  return { periodStart, periodEnd: addUtcMonthsClamped(periodStart, 1) };
}
