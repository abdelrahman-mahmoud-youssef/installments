'use client';

import { getDisplayInstallmentStatus, type InstallmentStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

export interface ProgressSegment {
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  dueDate: string;
}

const TRACK_TONE: Record<string, string> = {
  PAID: 'bg-success/15',
  COMPLETED: 'bg-success/15',
  PARTIALLY_PAID: 'bg-warning/15',
  OVERDUE: 'bg-danger/18',
  PENDING: 'bg-muted-foreground/12',
  CANCELLED: 'bg-muted-foreground/8',
};

const FILL_TONE: Record<string, string> = {
  PAID: 'bg-success',
  COMPLETED: 'bg-success',
  PARTIALLY_PAID: 'bg-warning',
  OVERDUE: 'bg-danger',
  PENDING: 'bg-transparent',
  CANCELLED: 'bg-transparent',
};

export function CollectionProgress({
  installments,
  size = 'md',
  className,
}: {
  installments: ProgressSegment[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const height = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={cn('flex w-full gap-0.5 overflow-hidden rounded-full', height, className)}>
      {installments.map((installment, index) => {
        const display = getDisplayInstallmentStatus(installment.status, installment.dueDate);
        const ratio =
          installment.amount > 0
            ? Math.min(1, Math.max(0, installment.paidAmount / installment.amount))
            : 0;
        return (
          <div
            key={index}
            className={cn('relative h-full overflow-hidden first:rounded-s-full last:rounded-e-full', TRACK_TONE[display])}
            style={{ flexGrow: Math.max(installment.amount, 1) }}
          >
            {ratio > 0 && (
              <div
                className={cn('absolute inset-y-0 start-0', FILL_TONE[display])}
                style={{ width: `${ratio * 100}%` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
