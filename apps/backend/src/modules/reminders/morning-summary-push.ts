import { NotificationLanguage } from '@prisma/client';
import { PushContent } from '../push/push.types';
import { formatCount, formatMoney } from './notification-format';
import { ReminderMessageData } from './reminder-message';

export type MorningSummaryTotals = Omit<ReminderMessageData, 'businessName'>;

interface MorningSummaryCopy {
  title: string;
  dueToday: (count: number, countText: string, amount: string) => string;
  overdue: (count: number, countText: string, amount: string) => string;
}

const MORNING_SUMMARY_COPY: Record<NotificationLanguage, MorningSummaryCopy> = {
  [NotificationLanguage.EN]: {
    title: 'Today’s installments',
    dueToday: (count, countText, amount) =>
      `Due today: ${countText} ${count === 1 ? 'installment' : 'installments'} (${amount})`,
    overdue: (count, countText, amount) =>
      `Overdue: ${countText} ${count === 1 ? 'installment' : 'installments'} (${amount})`,
  },
  [NotificationLanguage.AR]: {
    title: 'أقساط النهاردة',
    dueToday: (_count, countText, amount) => `مستحق النهاردة: ${countText} قسط (${amount})`,
    overdue: (_count, countText, amount) => `متأخر: ${countText} قسط (${amount})`,
  },
};

export function hasMorningSummary(totals: MorningSummaryTotals): boolean {
  return totals.dueTodayCount > 0 || totals.overdueCount > 0;
}

export function buildMorningSummaryPushContent(
  totals: MorningSummaryTotals,
  language: NotificationLanguage,
): PushContent {
  const copy = MORNING_SUMMARY_COPY[language];
  const lines: string[] = [];
  if (totals.dueTodayCount > 0) {
    lines.push(
      copy.dueToday(
        totals.dueTodayCount,
        formatCount(totals.dueTodayCount, language),
        formatMoney(totals.dueTodayTotal, language),
      ),
    );
  }
  if (totals.overdueCount > 0) {
    lines.push(
      copy.overdue(
        totals.overdueCount,
        formatCount(totals.overdueCount, language),
        formatMoney(totals.overdueTotal, language),
      ),
    );
  }
  return { title: copy.title, body: lines.join('\n') };
}
