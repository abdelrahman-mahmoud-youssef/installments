import { ContractStatus, Installment, InstallmentStatus } from '@/api/contracts';
import { PaymentClaimStatus } from '@/api/payment-claims';
import { BadgeTone } from '@/components/ui/badge';
import { todayIsoDate } from './format';

export type DerivedInstallmentStatus = InstallmentStatus | 'OVERDUE';

export function deriveInstallmentStatus(installment: Pick<Installment, 'dueDate' | 'status'>): DerivedInstallmentStatus {
  const isOpen = installment.status === 'PENDING' || installment.status === 'PARTIALLY_PAID';
  if (isOpen && installment.dueDate.slice(0, 10) < todayIsoDate()) {
    return 'OVERDUE';
  }
  return installment.status;
}

export const contractStatusTone: Record<ContractStatus, BadgeTone> = {
  ACTIVE: 'primary',
  COMPLETED: 'info',
  CANCELLED: 'neutral',
};

export const installmentStatusTone: Record<DerivedInstallmentStatus, BadgeTone> = {
  PENDING: 'neutral',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
  OVERDUE: 'danger',
};

export const paymentClaimStatusTone: Record<PaymentClaimStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DECLINED: 'danger',
};
