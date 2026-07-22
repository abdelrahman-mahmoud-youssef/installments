import { NotificationLanguage } from '@prisma/client';
import { buildEveningSummaryTemplateParams } from './evening-summary-message';

describe('buildEveningSummaryTemplateParams', () => {
  it('returns positional params in template order', () => {
    const params = buildEveningSummaryTemplateParams(
      {
        businessName: 'Demo Business',
        collectedToday: 30_000,
        overdueTotal: 20_000,
        dueTomorrowTotal: 15_000,
      },
      NotificationLanguage.EN,
    );

    expect(params).toEqual(['Demo Business', 'EGP 300.00', 'EGP 200.00', 'EGP 150.00']);
  });

  it('formats amounts in Arabic', () => {
    const params = buildEveningSummaryTemplateParams(
      {
        businessName: 'متجر تجريبي',
        collectedToday: 30_000,
        overdueTotal: 20_000,
        dueTomorrowTotal: 15_000,
      },
      NotificationLanguage.AR,
    );

    expect(params).toEqual(['متجر تجريبي', '٣٠٠٫٠٠ ج.م', '٢٠٠٫٠٠ ج.م', '١٥٠٫٠٠ ج.م']);
  });
});
