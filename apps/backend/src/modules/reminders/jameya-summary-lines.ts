import { NotificationLanguage } from '@prisma/client';
import { JameyaSummaryTotals } from '../jameyas/jameya-summary-totals';

interface JameyaSummaryCopy {
  dueToday: (count: string) => string;
  late: (count: string) => string;
  payoutsDueToday: (count: string) => string;
}

const JAMEYA_SUMMARY_COPY: Record<NotificationLanguage, JameyaSummaryCopy> = {
  [NotificationLanguage.EN]: {
    dueToday: (count) => `Jameya payments due today: ${count}`,
    late: (count) => `Late jameya payments: ${count}`,
    payoutsDueToday: (count) => `Jameya payouts due today: ${count}`,
  },
  [NotificationLanguage.AR]: {
    dueToday: (count) => `دفعات جمعيات مستحقة النهاردة: ${count}`,
    late: (count) => `دفعات جمعيات متأخرة: ${count}`,
    payoutsDueToday: (count) => `قبض جمعيات النهاردة: ${count}`,
  },
};

export function hasJameyaSummary(totals: JameyaSummaryTotals | undefined): boolean {
  return Boolean(totals && (totals.dueTodayCount > 0 || totals.lateCount > 0 || totals.payoutsDueTodayCount > 0));
}

export function formatJameyaSummaryLines(
  totals: JameyaSummaryTotals | undefined,
  language: NotificationLanguage,
  formatNumber: (count: number) => string,
): string[] {
  if (!totals) {
    return [];
  }
  const copy = JAMEYA_SUMMARY_COPY[language];
  const lines: string[] = [];
  if (totals.dueTodayCount > 0) {
    lines.push(copy.dueToday(formatNumber(totals.dueTodayCount)));
  }
  if (totals.lateCount > 0) {
    lines.push(copy.late(formatNumber(totals.lateCount)));
  }
  if (totals.payoutsDueTodayCount > 0) {
    lines.push(copy.payoutsDueToday(formatNumber(totals.payoutsDueTodayCount)));
  }
  return lines;
}
