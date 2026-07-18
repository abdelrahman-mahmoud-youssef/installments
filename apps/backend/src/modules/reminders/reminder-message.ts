import { NotificationLanguage } from '@prisma/client';
import { formatMoney } from './notification-format';

export interface ReminderMessageData {
  businessName: string;
  dueTodayCount: number;
  dueTodayTotal: number;
  overdueCount: number;
  overdueTotal: number;
}

export function formatReminderMessage(
  data: ReminderMessageData,
  language: NotificationLanguage,
): string {
  if (language === NotificationLanguage.AR) {
    return [
      `الملخّص اليومي لـ ${data.businessName}`,
      '',
      `مستحق اليوم: ${data.dueTodayCount} قسط - ${formatMoney(data.dueTodayTotal, language)}`,
      `متأخّر: ${data.overdueCount} قسط - ${formatMoney(data.overdueTotal, language)}`,
      `المتوقّع تحصيله اليوم: ${formatMoney(data.dueTodayTotal, language)}`,
    ].join('\n');
  }

  return [
    `Daily summary for ${data.businessName}`,
    '',
    `Due today: ${data.dueTodayCount} installment(s) - ${formatMoney(data.dueTodayTotal, language)}`,
    `Overdue: ${data.overdueCount} installment(s) - ${formatMoney(data.overdueTotal, language)}`,
    `Expected collections today: ${formatMoney(data.dueTodayTotal, language)}`,
  ].join('\n');
}
