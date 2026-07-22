import { NotificationLanguage } from '@prisma/client';
import { formatMoney } from './notification-format';

export interface CustomerWhatsappReminderData {
  customerName: string;
  businessName: string;
  totalOutstanding: number;
}

export function buildCustomerWhatsappReminderParams(
  data: CustomerWhatsappReminderData,
  language: NotificationLanguage,
): string[] {
  return [data.customerName, formatMoney(data.totalOutstanding, language), data.businessName];
}
