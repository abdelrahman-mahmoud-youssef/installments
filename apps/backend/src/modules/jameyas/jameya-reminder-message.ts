import { NotificationLanguage } from '@prisma/client';
import { formatDate, formatMoney } from '../reminders/notification-format';

export const JameyaReminderStatus = {
  LATE: 'LATE',
  DUE: 'DUE',
  UPCOMING: 'UPCOMING',
} as const;

export type JameyaReminderStatus = (typeof JameyaReminderStatus)[keyof typeof JameyaReminderStatus];

export interface JameyaReminderData {
  memberName: string;
  businessName: string;
  jameyaName: string;
  amountDue: number;
  dueDate: Date;
  status: JameyaReminderStatus;
}

const MESSAGE_COPY = {
  [NotificationLanguage.AR]: {
    greeting: (name: string) => `مرحباً ${name} 👋`,
    intro: (businessName: string, jameyaName: string) =>
      `معاك ${businessName} بخصوص جمعية "${jameyaName}".`,
    late: (amount: string, date: string) =>
      `⏰ عليك دفعة متأخرة: ${amount} (كانت مستحقة ${date})`,
    due: (amount: string, date: string) => `⏳ عليك دفعة مستحقة من يوم ${date}: ${amount}`,
    upcoming: (amount: string, date: string) => `📅 دفعتك الجاية: ${amount} مستحقة ${date}`,
    footer: 'لو حضرتك دفعت بالفعل، تجاهل الرسالة دي وسامحنا على الإزعاج 🙏',
  },
  [NotificationLanguage.EN]: {
    greeting: (name: string) => `Hi ${name} 👋`,
    intro: (businessName: string, jameyaName: string) =>
      `This is ${businessName} about your "${jameyaName}" jameya.`,
    late: (amount: string, date: string) => `⏰ Your payment of ${amount} is late (it was due ${date}).`,
    due: (amount: string, date: string) => `⏳ Your payment of ${amount} has been due since ${date}.`,
    upcoming: (amount: string, date: string) => `📅 Your next payment of ${amount} is due ${date}.`,
    footer: "If you've already paid, please ignore this message 🙏",
  },
};

export function formatJameyaReminderMessage(data: JameyaReminderData, language: NotificationLanguage): string {
  const copy = MESSAGE_COPY[language];
  const amount = formatMoney(data.amountDue, language);
  const date = formatDate(data.dueDate, language);
  const statusLine = {
    [JameyaReminderStatus.LATE]: copy.late,
    [JameyaReminderStatus.DUE]: copy.due,
    [JameyaReminderStatus.UPCOMING]: copy.upcoming,
  }[data.status];

  return [
    copy.greeting(data.memberName),
    copy.intro(data.businessName, data.jameyaName),
    '',
    statusLine(amount, date),
    '',
    copy.footer,
  ].join('\n');
}
