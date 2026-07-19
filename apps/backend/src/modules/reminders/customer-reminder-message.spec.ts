import { NotificationLanguage } from '@prisma/client';
import { formatCustomerReminderMessage } from './customer-reminder-message';

describe('formatCustomerReminderMessage', () => {
  it('returns null when nothing is due or overdue', () => {
    expect(
      formatCustomerReminderMessage(
        { businessName: 'Acme', dueToday: [], overdue: [] },
        NotificationLanguage.EN,
      ),
    ).toBeNull();
  });

  it('formats an itemized English message with due-today and overdue sections', () => {
    const message = formatCustomerReminderMessage(
      {
        businessName: 'Acme Electronics',
        dueToday: [{ productName: 'iPhone 15', remainingAmount: 125_000, dueDate: new Date('2026-07-18') }],
        overdue: [{ productName: 'Laptop', remainingAmount: 90_000, dueDate: new Date('2026-07-10') }],
      },
      NotificationLanguage.EN,
    );

    expect(message).toBe(
      [
        'Reminder from Acme Electronics',
        '',
        'Due today:',
        '• iPhone 15 — EGP 1,250.00 (18 Jul)',
        '',
        'Overdue:',
        '• Laptop — EGP 900.00 (10 Jul)',
      ].join('\n'),
    );
  });

  it('renders an itemized Arabic message', () => {
    const message = formatCustomerReminderMessage(
      {
        businessName: 'أكمي',
        dueToday: [{ productName: 'هاتف', remainingAmount: 125_000, dueDate: new Date('2026-07-18') }],
        overdue: [],
      },
      NotificationLanguage.AR,
    );

    expect(message).toContain('تذكير من أكمي');
    expect(message).toContain('مستحق النهاردة:');
    expect(message).toContain('هاتف');
  });
});
