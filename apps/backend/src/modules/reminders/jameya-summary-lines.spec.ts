import { NotificationLanguage } from '@prisma/client';
import { formatJameyaSummaryLines, hasJameyaSummary } from './jameya-summary-lines';
import { buildMorningSummaryPushContent, hasMorningSummary } from './morning-summary-push';
import { formatCount } from './notification-format';
import { formatReminderMessage } from './reminder-message';

const NO_INSTALLMENTS = { dueTodayCount: 0, dueTodayTotal: 0, overdueCount: 0, overdueTotal: 0 };
const JAMEYA = { dueTodayCount: 3, lateCount: 2, payoutsPendingCount: 1 };

describe('jameya lines in the morning summary', () => {
  it('lists dues today, late dues and payouts due today in English', () => {
    expect(formatJameyaSummaryLines(JAMEYA, NotificationLanguage.EN, String)).toEqual([
      'Jameya payments due today: 3',
      'Late jameya payments: 2',
      'Jameya payouts pending: 1',
    ]);
  });

  it('lists them in Arabic and leaves out counts that are zero', () => {
    expect(
      formatJameyaSummaryLines({ ...JAMEYA, dueTodayCount: 0 }, NotificationLanguage.AR, String),
    ).toEqual(['دفعات جمعيات متأخرة: 2', 'قبض جمعيات لسه متسلّمش: 1']);
  });

  it('adds no jameya lines when the shop has jameya turned off', () => {
    expect(formatJameyaSummaryLines(undefined, NotificationLanguage.EN, String)).toEqual([]);
    expect(formatReminderMessage({ businessName: 'Acme', ...NO_INSTALLMENTS }, NotificationLanguage.EN)).not.toMatch(
      /jameya/i,
    );
    expect(hasMorningSummary(NO_INSTALLMENTS)).toBe(false);
  });

  it('appends the jameya lines to the Telegram summary after the installment figures', () => {
    const message = formatReminderMessage(
      { businessName: 'Acme', ...NO_INSTALLMENTS, jameya: JAMEYA },
      NotificationLanguage.EN,
    );

    expect(message.split('\n').slice(-4)).toEqual([
      '',
      'Jameya payments due today: 3',
      'Late jameya payments: 2',
      'Jameya payouts pending: 1',
    ]);
  });

  it('sends the push even when only jameya figures are present, with localized counts', () => {
    const totals = { ...NO_INSTALLMENTS, jameya: { dueTodayCount: 0, lateCount: 4, payoutsPendingCount: 0 } };

    expect(hasJameyaSummary(totals.jameya)).toBe(true);
    expect(hasMorningSummary(totals)).toBe(true);
    const content = buildMorningSummaryPushContent(totals, NotificationLanguage.AR);
    expect(content.title).toBe('جمعيات النهاردة');
    expect(content.body).toBe(`دفعات جمعيات متأخرة: ${formatCount(4, NotificationLanguage.AR)}`);
    expect(buildMorningSummaryPushContent(totals, NotificationLanguage.EN).title).toBe('Today’s jameyas');
  });

  it('titles the push for both when installments and jameyas are present', () => {
    const totals = { ...NO_INSTALLMENTS, overdueCount: 1, overdueTotal: 45_000, jameya: JAMEYA };

    expect(buildMorningSummaryPushContent(totals, NotificationLanguage.EN).title).toBe(
      'Today’s installments and jameyas',
    );
    expect(buildMorningSummaryPushContent(totals, NotificationLanguage.AR).title).toBe('أقساط وجمعيات النهاردة');
  });
});
