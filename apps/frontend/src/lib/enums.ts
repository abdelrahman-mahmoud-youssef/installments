export const CALCULATION_METHODS = ['FIXED_COUNT', 'FIXED_AMOUNT', 'MARKUP_PERCENT'] as const;
export type CalculationMethod = (typeof CALCULATION_METHODS)[number];

export const CALCULATION_METHOD_LABELS: Record<CalculationMethod, string> = {
  FIXED_COUNT: 'Number of installments',
  FIXED_AMOUNT: 'Fixed monthly payment',
  MARKUP_PERCENT: 'Markup percentage',
};

export const RECURRENCE_TYPES = ['MONTHLY', 'EVERY_X_DAYS', 'WEEKLY', 'BIWEEKLY'] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  MONTHLY: 'Monthly',
  EVERY_X_DAYS: 'Every X days',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every two weeks',
};

export const CONTRACT_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const INSTALLMENT_STATUSES = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export type DisplayInstallmentStatus = InstallmentStatus | 'OVERDUE';

export function getDisplayInstallmentStatus(
  status: InstallmentStatus,
  dueDate: string,
  today: Date = new Date(),
): DisplayInstallmentStatus {
  const isOutstanding = status === 'PENDING' || status === 'PARTIALLY_PAID';
  return isOutstanding && new Date(dueDate) < today ? 'OVERDUE' : status;
}
