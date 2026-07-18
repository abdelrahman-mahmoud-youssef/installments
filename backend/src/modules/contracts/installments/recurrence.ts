import { RecurrenceType } from '@prisma/client';
import { addUtcDays, daysInUtcMonth, startOfUtcMonth, toUtcMidnight } from '../../../common/date/utc-date';

export interface GenerateDueDatesInput {
  firstPaymentDate: Date;
  recurrenceType: RecurrenceType;
  installmentCount: number;
  intervalDays?: number;
}

function getMonthlyOccurrence(anchor: Date, monthsToAdd: number): Date {
  const anchorDay = anchor.getUTCDate();
  const targetMonthStart = startOfUtcMonth(anchor, monthsToAdd);
  const targetDay = Math.min(anchorDay, daysInUtcMonth(targetMonthStart));
  return new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth(), targetDay));
}

export function generateDueDates(input: GenerateDueDatesInput): Date[] {
  const anchor = toUtcMidnight(input.firstPaymentDate);

  return Array.from({ length: input.installmentCount }, (_, index) => {
    switch (input.recurrenceType) {
      case RecurrenceType.MONTHLY:
        return getMonthlyOccurrence(anchor, index);
      case RecurrenceType.WEEKLY:
        return addUtcDays(anchor, index * 7);
      case RecurrenceType.BIWEEKLY:
        return addUtcDays(anchor, index * 14);
      case RecurrenceType.EVERY_X_DAYS:
        if (!input.intervalDays || input.intervalDays <= 0) {
          throw new Error('intervalDays must be a positive number for EVERY_X_DAYS recurrence.');
        }
        return addUtcDays(anchor, index * input.intervalDays);
      default:
        throw new Error(`Unsupported recurrence type: ${String(input.recurrenceType)}`);
    }
  });
}
