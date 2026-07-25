import { NotificationLanguage } from '@prisma/client';
import { formatContractReminderMessage } from './contract-reminder-message';

describe('formatContractReminderMessage', () => {
  it('returns null when there are no overdue installments', () => {
    expect(
      formatContractReminderMessage(
        {
          customerName: 'Ahmed',
          businessName: 'Acme',
          productName: 'iPhone 15',
          paidInstallments: 2,
          totalInstallments: 10,
          totalRemainingAmount: 800_000,
          overdueInstallments: [],
          location: null,
          payUrl: null,
        },
        NotificationLanguage.EN,
      ),
    ).toBeNull();
  });

  it('formats an English message with progress, overdue items, location, and pay link', () => {
    const message = formatContractReminderMessage(
      {
        customerName: 'Ahmed',
        businessName: 'Acme Electronics',
        productName: 'iPhone 15',
        paidInstallments: 3,
        totalInstallments: 10,
        totalRemainingAmount: 700_000,
        overdueInstallments: [{ sequence: 4, remainingAmount: 100_000, dueDate: new Date('2026-07-10') }],
        location: { name: 'Main Branch', address: '12 Tahrir St', mapUrl: 'https://maps.example.com/x' },
        payUrl: 'https://acme.example.com/customer/abc/contracts/xyz/pay',
      },
      NotificationLanguage.EN,
    );

    expect(message).toBe(
      [
        'Hi Ahmed 👋',
        'This is Acme Electronics regarding your "iPhone 15" plan.',
        '',
        '📋 Progress: 3 of 10 installments paid, 7 left.',
        '💰 Total remaining: EGP 7,000.00',
        '',
        '⏰ Overdue installments:',
        '• Installment #4: EGP 1,000.00 (was due 10 Jul)',
        '',
        '📍 You can pay at:',
        'Main Branch — 12 Tahrir St',
        'https://maps.example.com/x',
        '',
        '💳 Pay now: https://acme.example.com/customer/abc/contracts/xyz/pay',
        '',
        "If you've already paid, please ignore this message 🙏",
      ].join('\n'),
    );
  });

  it('renders an Egyptian-Arabic message', () => {
    const message = formatContractReminderMessage(
      {
        customerName: 'أحمد',
        businessName: 'أكمي',
        productName: 'آيفون 15',
        paidInstallments: 3,
        totalInstallments: 10,
        totalRemainingAmount: 700_000,
        overdueInstallments: [{ sequence: 4, remainingAmount: 100_000, dueDate: new Date('2026-07-10') }],
        location: null,
        payUrl: null,
      },
      NotificationLanguage.AR,
    );

    expect(message).toContain('مرحباً أحمد 👋');
    expect(message).toContain('اتسدد 3 من 10 قسط، وباقي 7');
    expect(message).toContain('قسط رقم 4');
    expect(message).toContain('سددت بالفعل');
  });
});
