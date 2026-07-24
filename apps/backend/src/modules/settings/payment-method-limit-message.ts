import { NotificationLanguage } from '@prisma/client';
import { formatMoney } from '../reminders/notification-format';

export interface PaymentMethodLimitAlertData {
  businessName: string;
  methodLabel: string;
  used: number;
  limit: number;
  remaining: number;
}

export function buildPaymentMethodLimitAlertParams(
  data: PaymentMethodLimitAlertData,
  language: NotificationLanguage,
): string[] {
  return [
    data.businessName,
    data.methodLabel,
    formatMoney(data.used, language),
    formatMoney(data.limit, language),
    formatMoney(data.remaining, language),
  ];
}
