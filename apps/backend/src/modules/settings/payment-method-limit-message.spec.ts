import { NotificationLanguage } from '@prisma/client';
import { buildPaymentMethodLimitAlertParams } from './payment-method-limit-message';

describe('buildPaymentMethodLimitAlertParams', () => {
  it('returns positional params in template order', () => {
    const params = buildPaymentMethodLimitAlertParams(
      {
        businessName: 'Demo Business',
        methodLabel: 'InstaPay',
        accountDetails: '01012345678',
        used: 32_000_00,
        limit: 40_000_00,
        remaining: 8_000_00,
      },
      NotificationLanguage.EN,
    );

    expect(params).toEqual([
      'Demo Business',
      'InstaPay',
      '01012345678',
      'EGP 32,000.00',
      'EGP 40,000.00',
      'EGP 8,000.00',
    ]);
  });

  it('formats amounts in Arabic', () => {
    const params = buildPaymentMethodLimitAlertParams(
      {
        businessName: 'متجر تجريبي',
        methodLabel: 'InstaPay',
        accountDetails: '01012345678',
        used: 32_000_00,
        limit: 40_000_00,
        remaining: 8_000_00,
      },
      NotificationLanguage.AR,
    );

    expect(params).toEqual([
      'متجر تجريبي',
      'InstaPay',
      '01012345678',
      '٣٢٬٠٠٠٫٠٠ ج.م',
      '٤٠٬٠٠٠٫٠٠ ج.م',
      '٨٬٠٠٠٫٠٠ ج.م',
    ]);
  });
});
