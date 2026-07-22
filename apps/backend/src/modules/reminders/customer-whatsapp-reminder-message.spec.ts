import { NotificationLanguage } from '@prisma/client';
import { buildCustomerWhatsappReminderParams } from './customer-whatsapp-reminder-message';

describe('buildCustomerWhatsappReminderParams', () => {
  it('returns positional params in template order', () => {
    const params = buildCustomerWhatsappReminderParams(
      { customerName: 'Mona Ibrahim', businessName: 'Demo Business', totalOutstanding: 25_000 },
      NotificationLanguage.EN,
    );

    expect(params).toEqual(['Mona Ibrahim', 'EGP 250.00', 'Demo Business']);
  });
});
