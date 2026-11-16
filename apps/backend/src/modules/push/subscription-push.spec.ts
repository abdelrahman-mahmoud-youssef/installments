import { NotificationLanguage } from '@prisma/client';
import { buildSubscriptionPushContent } from './subscription-push-message';
import {
  buildSubscriptionPushDedupeKey,
  resolveExpiryDateForMilestone,
  SUBSCRIPTION_PUSH_MILESTONES,
} from './subscription-push-schedule';

const today = new Date('2026-12-10T00:00:00.000Z');

describe('subscription push schedule', () => {
  it('targets shops expiring in 3 days and shops that expired 1 day ago', () => {
    const expiryDates = SUBSCRIPTION_PUSH_MILESTONES.map((milestone) =>
      resolveExpiryDateForMilestone(milestone, today).toISOString().slice(0, 10),
    );

    expect(expiryDates).toEqual(['2026-12-13', '2026-12-09']);
  });

  it('builds a dedupe key that changes when the subscription is renewed', () => {
    const beforeRenewal = buildSubscriptionPushDedupeKey('SUBSCRIPTION_EXPIRING', 'shop-1', new Date('2026-12-13'));
    const afterRenewal = buildSubscriptionPushDedupeKey('SUBSCRIPTION_EXPIRING', 'shop-1', new Date('2027-01-13'));

    expect(beforeRenewal).toBe('SUBSCRIPTION_EXPIRING:shop-1:2026-12-13');
    expect(afterRenewal).not.toBe(beforeRenewal);
  });
});

describe('subscription push content', () => {
  it('mentions the number of days left before expiry', () => {
    const english = buildSubscriptionPushContent('SUBSCRIPTION_EXPIRING', NotificationLanguage.EN);

    expect(english.body).toContain('3 days');
  });

  it('never mentions a price or payment step', () => {
    const kinds = ['SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED'] as const;
    const languages = [NotificationLanguage.EN, NotificationLanguage.AR];

    for (const kind of kinds) {
      for (const language of languages) {
        const { title, body } = buildSubscriptionPushContent(kind, language);
        expect(`${title} ${body}`).not.toMatch(/EGP|جنيه|\d{3}/);
      }
    }
  });

  it('tells an expired shop that it is read-only in Arabic', () => {
    const arabic = buildSubscriptionPushContent('SUBSCRIPTION_EXPIRED', NotificationLanguage.AR);

    expect(arabic.body).toContain('للقراءة فقط');
  });
});
