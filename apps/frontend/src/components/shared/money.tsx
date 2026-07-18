'use client';

import { useLocale } from 'next-intl';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Money({ minorUnits, className }: { minorUnits: number; className?: string }) {
  const locale = useLocale();
  return <span className={cn('tabular-nums', className)}>{formatMoney(minorUnits, locale)}</span>;
}
