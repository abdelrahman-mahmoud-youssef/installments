import { formatCustomerReminderMessage } from './customer-reminder-message';

describe('formatCustomerReminderMessage', () => {
  it('returns null when nothing is due or overdue', () => {
    expect(formatCustomerReminderMessage({ businessName: 'Acme', dueToday: [], overdue: [] })).toBeNull();
  });

  it('formats an itemized message with due-today and overdue sections', () => {
    const message = formatCustomerReminderMessage({
      businessName: 'Acme Electronics',
      dueToday: [{ productName: 'iPhone 15', remainingAmount: 125_000, dueDate: new Date('2026-07-18') }],
      overdue: [{ productName: 'Laptop', remainingAmount: 90_000, dueDate: new Date('2026-07-10') }],
    });

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

  it('omits the overdue section when there is nothing overdue', () => {
    const message = formatCustomerReminderMessage({
      businessName: 'Acme',
      dueToday: [{ productName: 'TV', remainingAmount: 50_000, dueDate: new Date('2026-07-18') }],
      overdue: [],
    });

    expect(message).toBe(['Reminder from Acme', '', 'Due today:', '• TV — EGP 500.00 (18 Jul)'].join('\n'));
  });
});
