import { NotificationLanguage } from '@prisma/client';
import { formatMoney } from '../reminders/notification-format';

export interface PaymentMethodLimitAlertData {
  businessName: string;
  methodLabel: string;
  accountDetails: string;
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
    data.accountDetails,
    formatMoney(data.used, language),
    formatMoney(data.limit, language),
    formatMoney(data.remaining, language),
  ];
}
