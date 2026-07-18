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

function formatMoney(minorUnits: number): string {
  return `EGP ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function formatItem(item: CustomerReminderItem): string {
  return `• ${item.productName} — ${formatMoney(item.remainingAmount)} (${formatDate(item.dueDate)})`;
}

export function formatCustomerReminderMessage(data: CustomerReminderData): string | null {
  if (data.dueToday.length === 0 && data.overdue.length === 0) {
    return null;
  }

  const lines = [`Reminder from ${data.businessName}`];

  if (data.dueToday.length > 0) {
    lines.push('', 'Due today:', ...data.dueToday.map(formatItem));
  }

  if (data.overdue.length > 0) {
    lines.push('', 'Overdue:', ...data.overdue.map(formatItem));
  }

  return lines.join('\n');
}
