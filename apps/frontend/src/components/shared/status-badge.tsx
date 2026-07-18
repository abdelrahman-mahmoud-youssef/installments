import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-500/20 dark:text-zinc-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
