import { buildReminderEligibleTenantWhere } from './reminder-eligible-tenant-where';

describe('buildReminderEligibleTenantWhere', () => {
  const today = new Date('2026-12-10T00:00:00.000Z');

  it('keeps only shops whose subscription is still active', () => {
    expect(buildReminderEligibleTenantWhere(today).subscriptionExpiresOn).toEqual({ gt: today });
  });

  it('excludes demo shops so they never message real phone numbers', () => {
    expect(buildReminderEligibleTenantWhere(today).isDemo).toBe(false);
  });
});
