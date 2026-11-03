import {
  calculateDaysRemaining,
  calculateNextSubscriptionPeriod,
  calculateTrialExpiry,
  isRenewalDueSoon,
  isSubscriptionActive,
  resolveSubscriptionStatus,
  SubscriptionStatus,
} from './subscription';

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe('isSubscriptionActive', () => {
  it('is active on every day before the expiry date', () => {
    expect(isSubscriptionActive(utcDate('2026-12-01'), utcDate('2026-11-30'))).toBe(true);
  });

  it('is inactive from the expiry date onward', () => {
    expect(isSubscriptionActive(utcDate('2026-12-01'), utcDate('2026-12-01'))).toBe(false);
    expect(isSubscriptionActive(utcDate('2026-12-01'), utcDate('2026-12-15'))).toBe(false);
  });
});

describe('resolveSubscriptionStatus', () => {
  const today = utcDate('2026-11-03');

  it('reports a trial while an unpaid shop is inside its free period', () => {
    expect(resolveSubscriptionStatus({ expiresOn: utcDate('2026-11-10'), hasPaidPeriod: false }, today)).toBe(
      SubscriptionStatus.TRIAL,
    );
  });

  it('reports active while a paid period is running', () => {
    expect(resolveSubscriptionStatus({ expiresOn: utcDate('2026-11-10'), hasPaidPeriod: true }, today)).toBe(
      SubscriptionStatus.ACTIVE,
    );
  });

  it('reports expired once the expiry date is reached, paid or not', () => {
    expect(resolveSubscriptionStatus({ expiresOn: today, hasPaidPeriod: true }, today)).toBe(
      SubscriptionStatus.EXPIRED,
    );
    expect(resolveSubscriptionStatus({ expiresOn: today, hasPaidPeriod: false }, today)).toBe(
      SubscriptionStatus.EXPIRED,
    );
  });
});

describe('calculateTrialExpiry', () => {
  it('gives a new shop fourteen free days', () => {
    expect(isoDate(calculateTrialExpiry(utcDate('2026-11-03')))).toBe('2026-11-17');
  });
});

describe('calculateNextSubscriptionPeriod', () => {
  it('starts today when the subscription has already expired', () => {
    const period = calculateNextSubscriptionPeriod(utcDate('2026-10-20'), utcDate('2026-11-03'));

    expect(isoDate(period.periodStart)).toBe('2026-11-03');
    expect(isoDate(period.periodEnd)).toBe('2026-12-03');
  });

  it('extends from the current expiry when renewed early so no paid days are lost', () => {
    const period = calculateNextSubscriptionPeriod(utcDate('2026-11-20'), utcDate('2026-11-03'));

    expect(isoDate(period.periodStart)).toBe('2026-11-20');
    expect(isoDate(period.periodEnd)).toBe('2026-12-20');
  });

  it('clamps to the last day of a shorter month', () => {
    const period = calculateNextSubscriptionPeriod(utcDate('2026-01-31'), utcDate('2026-01-31'));

    expect(isoDate(period.periodEnd)).toBe('2026-02-28');
  });
});

describe('calculateDaysRemaining', () => {
  it('counts the active days left before the expiry date', () => {
    expect(calculateDaysRemaining(utcDate('2026-12-01'), utcDate('2026-11-26'))).toBe(5);
    expect(calculateDaysRemaining(utcDate('2026-12-01'), utcDate('2026-11-30'))).toBe(1);
  });

  it('never goes below zero once expired', () => {
    expect(calculateDaysRemaining(utcDate('2026-12-01'), utcDate('2026-12-01'))).toBe(0);
    expect(calculateDaysRemaining(utcDate('2026-12-01'), utcDate('2026-12-20'))).toBe(0);
  });

  it('counts across a month boundary', () => {
    expect(calculateDaysRemaining(utcDate('2027-03-02'), utcDate('2027-02-27'))).toBe(3);
  });
});

describe('isRenewalDueSoon', () => {
  it('is due soon within the last five active days', () => {
    expect(isRenewalDueSoon(utcDate('2026-12-01'), utcDate('2026-11-26'))).toBe(true);
    expect(isRenewalDueSoon(utcDate('2026-12-01'), utcDate('2026-11-30'))).toBe(true);
  });

  it('is not due soon earlier in the period', () => {
    expect(isRenewalDueSoon(utcDate('2026-12-01'), utcDate('2026-11-25'))).toBe(false);
  });

  it('is not due soon once expired', () => {
    expect(isRenewalDueSoon(utcDate('2026-12-01'), utcDate('2026-12-01'))).toBe(false);
  });
});
