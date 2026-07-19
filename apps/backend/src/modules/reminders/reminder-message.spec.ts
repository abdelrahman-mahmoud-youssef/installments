import { NotificationLanguage } from '@prisma/client';
import { formatReminderMessage } from './reminder-message';

describe('formatReminderMessage', () => {
  it('includes the business name, due-today, and overdue figures in English', () => {
    const message = formatReminderMessage(
      {
        businessName: 'Demo Business',
        dueTodayCount: 3,
        dueTodayTotal: 15_000,
        overdueCount: 2,
        overdueTotal: 5_000,
      },
      NotificationLanguage.EN,
    );

    expect(message).toContain('Demo Business');
    expect(message).toContain('Due today: 3 installment(s) - EGP 150.00');
    expect(message).toContain('Overdue: 2 installment(s) - EGP 50.00');
  });

  it('renders the summary in Arabic', () => {
    const message = formatReminderMessage(
      {
        businessName: 'متجر تجريبي',
        dueTodayCount: 3,
        dueTodayTotal: 15_000,
        overdueCount: 2,
        overdueTotal: 5_000,
      },
      NotificationLanguage.AR,
    );

    expect(message).toContain('متجر تجريبي');
    expect(message).toContain('مستحق النهاردة:');
    expect(message).toContain('متأخر:');
  });
});
