'use client';

import { useLocale } from 'next-intl';
import { formatMoney, MoneyFormatOptions } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Money({
  minorUnits,
  className,
  ...options
}: { minorUnits: number; className?: string } & MoneyFormatOptions) {
  const locale = useLocale();
  return <span className={cn('tabular-nums', className)}>{formatMoney(minorUnits, locale, options)}</span>;
}
