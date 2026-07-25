import { NotificationLanguage } from '@prisma/client';
import { formatDate, formatMoney } from '../reminders/notification-format';

export interface ContractReminderOverdueItem {
  sequence: number;
  remainingAmount: number;
  dueDate: Date;
}

export interface ContractReminderLocation {
  name: string;
  address: string;
  mapUrl?: string;
}

export interface ContractReminderProgress {
  paidInstallments: number;
  totalInstallments: number;
}

export interface ContractReminderData {
  customerName: string;
  businessName: string;
  productName: string;
  progress: ContractReminderProgress | null;
  totalRemainingAmount: number | null;
  overdueInstallments: ContractReminderOverdueItem[];
  location: ContractReminderLocation | null;
  payUrl: string | null;
}

const MESSAGE_COPY = {
  [NotificationLanguage.AR]: {
    greeting: (name: string) => `مرحباً ${name} 👋`,
    intro: (businessName: string, productName: string) => `معاك ${businessName} بخصوص "${productName}".`,
    progress: (paid: number, total: number, remaining: number) =>
      `📋 الحالة: اتسدد ${paid} من ${total} قسط، وباقي ${remaining}.`,
    totalRemaining: (amount: string) => `💰 المتبقي عليك: ${amount}`,
    overdueHeader: '⏰ للأسف في أقساط متأخرة:',
    overdueItem: (sequence: number, amount: string, date: string) => `• قسط رقم ${sequence}: ${amount} (كان مستحق ${date})`,
    locationHeader: '📍 تقدر تسدد في:',
    payCta: (url: string) => `💳 ادفع دلوقتي من هنا: ${url}`,
    footer: 'لو حضرتك سددت بالفعل، تجاهل الرسالة دي وسامحنا على الإزعاج 🙏',
  },
  [NotificationLanguage.EN]: {
    greeting: (name: string) => `Hi ${name} 👋`,
    intro: (businessName: string, productName: string) => `This is ${businessName} regarding your "${productName}" plan.`,
    progress: (paid: number, total: number, remaining: number) =>
      `📋 Progress: ${paid} of ${total} installments paid, ${remaining} left.`,
    totalRemaining: (amount: string) => `💰 Total remaining: ${amount}`,
    overdueHeader: '⏰ Overdue installments:',
    overdueItem: (sequence: number, amount: string, date: string) => `• Installment #${sequence}: ${amount} (was due ${date})`,
    locationHeader: '📍 You can pay at:',
    payCta: (url: string) => `💳 Pay now: ${url}`,
    footer: "If you've already paid, please ignore this message 🙏",
  },
};

export function formatContractReminderMessage(
  data: ContractReminderData,
  language: NotificationLanguage,
): string | null {
  if (data.overdueInstallments.length === 0) {
    return null;
  }

  const copy = MESSAGE_COPY[language];

  const lines = [copy.greeting(data.customerName), copy.intro(data.businessName, data.productName)];

  const statusLines: string[] = [];
  if (data.progress) {
    const remainingInstallments = data.progress.totalInstallments - data.progress.paidInstallments;
    statusLines.push(copy.progress(data.progress.paidInstallments, data.progress.totalInstallments, remainingInstallments));
  }
  if (data.totalRemainingAmount !== null) {
    statusLines.push(copy.totalRemaining(formatMoney(data.totalRemainingAmount, language)));
  }
  if (statusLines.length > 0) {
    lines.push('', ...statusLines);
  }

  lines.push(
    '',
    copy.overdueHeader,
    ...data.overdueInstallments.map((item) =>
      copy.overdueItem(item.sequence, formatMoney(item.remainingAmount, language), formatDate(item.dueDate, language)),
    ),
  );

  if (data.location) {
    lines.push('', copy.locationHeader, `${data.location.name} — ${data.location.address}`);
    if (data.location.mapUrl) {
      lines.push(data.location.mapUrl);
    }
  }

  if (data.payUrl) {
    lines.push('', copy.payCta(data.payUrl));
  }

  lines.push('', copy.footer);

  return lines.join('\n');
}
