export const EXAMPLE_INSTALLMENT_AMOUNT = 45000;
export const EXAMPLE_INSTALLMENT_COUNT = 6;
export const EXAMPLE_PAID_COUNT = 3;

export const EXAMPLE_TOTAL_AMOUNT = EXAMPLE_INSTALLMENT_AMOUNT * EXAMPLE_INSTALLMENT_COUNT;
export const EXAMPLE_PAID_AMOUNT = EXAMPLE_INSTALLMENT_AMOUNT * EXAMPLE_PAID_COUNT;

export type ExampleInstallmentStatus = 'paid' | 'next' | 'upcoming';

function statusOf(index: number): ExampleInstallmentStatus {
  if (index < EXAMPLE_PAID_COUNT) {
    return 'paid';
  }
  return index === EXAMPLE_PAID_COUNT ? 'next' : 'upcoming';
}

export const EXAMPLE_INSTALLMENTS = Array.from({ length: EXAMPLE_INSTALLMENT_COUNT }, (_, index) => ({
  number: index + 1,
  status: statusOf(index),
}));

export const STATUS_STYLES: Record<ExampleInstallmentStatus, string> = {
  paid: 'bg-teal-soft text-teal',
  next: 'bg-primary text-primary-foreground',
  upcoming: 'bg-muted text-muted-foreground',
};

export const STATUS_LABEL_KEYS = {
  paid: 'statusPaid',
  next: 'statusNext',
  upcoming: 'statusUpcoming',
} as const;
