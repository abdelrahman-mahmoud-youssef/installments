'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<string, string> = {
  PAID: 'bg-success-soft text-success',
  COMPLETED: 'bg-success-soft text-success',
  PARTIALLY_PAID: 'bg-warning-soft text-warning',
  OVERDUE: 'bg-danger-soft text-danger',
  ACTIVE: 'bg-info-soft text-info',
  PENDING: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
  DELETED: 'bg-muted text-muted-foreground',
};

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: string;
  className?: string;
  dot?: boolean;
}) {
  const t = useTranslations('status');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        STATUS_TONE[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
      {t.has(status) ? t(status) : status}
    </span>
  );
}
