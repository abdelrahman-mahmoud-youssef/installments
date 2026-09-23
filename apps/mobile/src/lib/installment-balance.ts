import type { Installment } from '@/api/contracts';

export function isOutstanding(installment: Pick<Installment, 'status'>): boolean {
  return installment.status === 'PENDING' || installment.status === 'PARTIALLY_PAID';
}

export function remainingOf(installment: Pick<Installment, 'amount' | 'paidAmount'>): number {
  return Math.max(installment.amount - installment.paidAmount, 0);
}

export function outstandingInstallments(installments: Installment[]): Installment[] {
  return installments.filter(isOutstanding).sort((first, second) => first.sequence - second.sequence);
}
