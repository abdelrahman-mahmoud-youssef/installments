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
      `ملخص النهاردة بتاع ${data.businessName}`,
      '',
      `مستحق النهاردة: ${data.dueTodayCount} قسط - ${formatMoney(data.dueTodayTotal, language)}`,
      `متأخر: ${data.overdueCount} قسط - ${formatMoney(data.overdueTotal, language)}`,
      `المفروض يتحصّل النهاردة: ${formatMoney(data.dueTodayTotal, language)}`,
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

export function buildReminderTemplateParams(
  data: ReminderMessageData,
  language: NotificationLanguage,
): string[] {
  return [
    data.businessName,
    String(data.dueTodayCount),
    formatMoney(data.dueTodayTotal, language),
    String(data.overdueCount),
    formatMoney(data.overdueTotal, language),
  ];
}
