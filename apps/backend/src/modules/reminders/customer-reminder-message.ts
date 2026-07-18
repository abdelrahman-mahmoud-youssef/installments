import { NotificationLanguage } from '@prisma/client';
import { formatDate, formatMoney } from './notification-format';

export interface CustomerReminderItem {
  productName: string;
  remainingAmount: number;
  dueDate: Date;
}

export interface CustomerReminderData {
  businessName: string;
  dueToday: CustomerReminderItem[];
  overdue: CustomerReminderItem[];
}

const MESSAGE_COPY = {
  [NotificationLanguage.AR]: {
    header: (businessName: string) => `تذكير من ${businessName}`,
    dueToday: 'مستحق اليوم:',
    overdue: 'متأخّر:',
  },
  [NotificationLanguage.EN]: {
    header: (businessName: string) => `Reminder from ${businessName}`,
    dueToday: 'Due today:',
    overdue: 'Overdue:',
  },
};

function formatItem(item: CustomerReminderItem, language: NotificationLanguage): string {
  return `• ${item.productName} — ${formatMoney(item.remainingAmount, language)} (${formatDate(item.dueDate, language)})`;
}

export function formatCustomerReminderMessage(
  data: CustomerReminderData,
  language: NotificationLanguage,
): string | null {
  if (data.dueToday.length === 0 && data.overdue.length === 0) {
    return null;
  }

  const copy = MESSAGE_COPY[language];
  const lines = [copy.header(data.businessName)];

  if (data.dueToday.length > 0) {
    lines.push('', copy.dueToday, ...data.dueToday.map((item) => formatItem(item, language)));
  }

  if (data.overdue.length > 0) {
    lines.push('', copy.overdue, ...data.overdue.map((item) => formatItem(item, language)));
  }

  return lines.join('\n');
}
