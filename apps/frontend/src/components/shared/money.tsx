import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Money({ minorUnits, className }: { minorUnits: number; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(minorUnits)}</span>;
}
