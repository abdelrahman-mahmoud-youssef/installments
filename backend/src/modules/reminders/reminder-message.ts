function formatMoney(minorUnits: number): string {
  return `$${(minorUnits / 100).toFixed(2)}`;
}

export interface ReminderMessageData {
  businessName: string;
  dueTodayCount: number;
  dueTodayTotal: number;
  overdueCount: number;
  overdueTotal: number;
}

export function formatReminderMessage(data: ReminderMessageData): string {
  return [
    `Daily summary for ${data.businessName}`,
    '',
    `Due today: ${data.dueTodayCount} installment(s) - ${formatMoney(data.dueTodayTotal)}`,
    `Overdue: ${data.overdueCount} installment(s) - ${formatMoney(data.overdueTotal)}`,
    `Expected collections today: ${formatMoney(data.dueTodayTotal)}`,
  ].join('\n');
}
