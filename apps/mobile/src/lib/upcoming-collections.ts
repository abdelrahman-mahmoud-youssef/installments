import { shiftIsoDate } from './calendar';

export interface OutstandingInstallment {
  dueDate: string;
  amount: number;
  paidAmount: number;
}

export interface DailyCollection {
  date: string;
  amount: number;
}

const ISO_DATE_LENGTH = 10;

export function buildDailyCollections(
  installments: OutstandingInstallment[],
  firstDate: string,
  dayCount: number,
): DailyCollection[] {
  const amountByDate = new Map<string, number>();
  for (const installment of installments) {
    const date = installment.dueDate.slice(0, ISO_DATE_LENGTH);
    const remaining = installment.amount - installment.paidAmount;
    amountByDate.set(date, (amountByDate.get(date) ?? 0) + remaining);
  }
  return Array.from({ length: dayCount }, (_, offset) => {
    const date = shiftIsoDate(firstDate, offset);
    return { date, amount: amountByDate.get(date) ?? 0 };
  });
}
