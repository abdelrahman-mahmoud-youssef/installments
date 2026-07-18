import { formatReminderMessage } from './reminder-message';

describe('formatReminderMessage', () => {
  it('includes the business name, due-today, and overdue figures', () => {
    const message = formatReminderMessage({
      businessName: 'Demo Business',
      dueTodayCount: 3,
      dueTodayTotal: 15_000,
      overdueCount: 2,
      overdueTotal: 5_000,
    });

    expect(message).toContain('Demo Business');
    expect(message).toContain('Due today: 3 installment(s) - $150.00');
    expect(message).toContain('Overdue: 2 installment(s) - $50.00');
  });

  it('formats zero amounts correctly', () => {
    const message = formatReminderMessage({
      businessName: 'Demo Business',
      dueTodayCount: 0,
      dueTodayTotal: 0,
      overdueCount: 0,
      overdueTotal: 0,
    });

    expect(message).toContain('Due today: 0 installment(s) - $0.00');
    expect(message).toContain('Overdue: 0 installment(s) - $0.00');
  });
});
