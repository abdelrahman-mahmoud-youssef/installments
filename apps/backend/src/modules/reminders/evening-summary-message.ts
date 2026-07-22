import { NotificationLanguage } from '@prisma/client';
import { formatMoney } from './notification-format';

export interface EveningSummaryData {
  businessName: string;
  collectedToday: number;
  overdueTotal: number;
  dueTomorrowTotal: number;
}

export function buildEveningSummaryTemplateParams(
  data: EveningSummaryData,
  language: NotificationLanguage,
): string[] {
  return [
    data.businessName,
    formatMoney(data.collectedToday, language),
    formatMoney(data.overdueTotal, language),
    formatMoney(data.dueTomorrowTotal, language),
  ];
}
