import { NotificationLanguage } from '@prisma/client';
import { PushContent } from '../push/push.types';
import { formatJameyaSummaryLines, hasJameyaSummary } from './jameya-summary-lines';
import { formatCount, formatMoney } from './notification-format';
import { ReminderMessageData } from './reminder-message';

export type MorningSummaryTotals = Omit<ReminderMessageData, 'businessName'>;

interface MorningSummaryCopy {
  title: string;
  jameyaTitle: string;
  combinedTitle: string;
  dueToday: (count: number, countText: string, amount: string) => string;
  overdue: (count: number, countText: string, amount: string) => string;
}

const MORNING_SUMMARY_COPY: Record<NotificationLanguage, MorningSummaryCopy> = {
  [NotificationLanguage.EN]: {
    title: 'Today’s installments',
    jameyaTitle: 'Today’s jameyas',
    combinedTitle: 'Today’s installments and jameyas',
    dueToday: (count, countText, amount) =>
      `Due today: ${countText} ${count === 1 ? 'installment' : 'installments'} (${amount})`,
    overdue: (count, countText, amount) =>
      `Overdue: ${countText} ${count === 1 ? 'installment' : 'installments'} (${amount})`,
  },
  [NotificationLanguage.AR]: {
    title: 'أقساط النهاردة',
    jameyaTitle: 'جمعيات النهاردة',
    combinedTitle: 'أقساط وجمعيات النهاردة',
    dueToday: (_count, countText, amount) => `مستحق النهاردة: ${countText} قسط (${amount})`,
    overdue: (_count, countText, amount) => `متأخر: ${countText} قسط (${amount})`,
  },
};

function resolveTitle(copy: MorningSummaryCopy, hasInstallments: boolean, hasJameyas: boolean): string {
  if (hasInstallments && hasJameyas) {
    return copy.combinedTitle;
  }
  return hasJameyas ? copy.jameyaTitle : copy.title;
}

export function hasMorningSummary(totals: MorningSummaryTotals): boolean {
  return totals.dueTodayCount > 0 || totals.overdueCount > 0 || hasJameyaSummary(totals.jameya);
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
  const jameyaLines = formatJameyaSummaryLines(totals.jameya, language, (count) => formatCount(count, language));
  return {
    title: resolveTitle(copy, lines.length > 0, jameyaLines.length > 0),
    body: [...lines, ...jameyaLines].join('\n'),
  };
}
