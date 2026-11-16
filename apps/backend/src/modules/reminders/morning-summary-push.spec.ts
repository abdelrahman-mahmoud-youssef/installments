import { NotificationLanguage } from '@prisma/client';
import { buildMorningSummaryPushContent, hasMorningSummary } from './morning-summary-push';

const NOTHING = { dueTodayCount: 0, dueTodayTotal: 0, overdueCount: 0, overdueTotal: 0 };

describe('morning summary push', () => {
  it('has nothing to send when nothing is due or overdue', () => {
    expect(hasMorningSummary(NOTHING)).toBe(false);
  });

  it('lists what is due today and what is overdue in English', () => {
    const content = buildMorningSummaryPushContent(
      { dueTodayCount: 3, dueTodayTotal: 135000, overdueCount: 1, overdueTotal: 45000 },
      NotificationLanguage.EN,
    );

    expect(content.title).toBe('Today’s installments');
    expect(content.body).toBe('Due today: 3 installments (EGP 1,350.00)\nOverdue: 1 installment (EGP 450.00)');
  });

  it('leaves out the due line when only overdue installments remain', () => {
    const totals = { ...NOTHING, overdueCount: 2, overdueTotal: 90000 };

    expect(hasMorningSummary(totals)).toBe(true);
    expect(buildMorningSummaryPushContent(totals, NotificationLanguage.EN).body).toBe(
      'Overdue: 2 installments (EGP 900.00)',
    );
  });

  it('writes the summary in Arabic', () => {
    const content = buildMorningSummaryPushContent(
      { ...NOTHING, dueTodayCount: 2, dueTodayTotal: 90000 },
      NotificationLanguage.AR,
    );

    expect(content.title).toBe('أقساط النهاردة');
    expect(content.body).toContain('مستحق النهاردة');
    expect(content.body).toContain('ج.م');
    expect(content.body).not.toContain('متأخر');
  });
});
