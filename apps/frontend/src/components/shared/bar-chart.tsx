'use client';

import { useLocale } from 'next-intl';
import { formatCompactMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface BarDatum {
  label: string;
  value: number;
}

export function BarChart({ data, className }: { data: BarDatum[]; className?: string }) {
  const locale = useLocale();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('flex h-44 items-end gap-2 sm:gap-3', className)}>
      {data.map((datum, index) => {
        const heightPct = (datum.value / max) * 100;
        const hasValue = datum.value > 0;
        return (
          <div key={index} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-md transition-all duration-300',
                  hasValue ? 'bg-primary/25 group-hover:bg-primary/40' : 'bg-muted',
                )}
                style={{ height: `${Math.max(heightPct, hasValue ? 6 : 3)}%` }}
              >
                <div
                  className={cn(
                    'h-full w-full rounded-md',
                    hasValue && 'bg-gradient-to-t from-primary/70 to-primary',
                  )}
                />
              </div>
              {hasValue && (
                <div className="pointer-events-none absolute -top-8 start-1/2 z-10 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-md ring-1 ring-border transition-opacity group-hover:opacity-100 rtl:translate-x-1/2">
                  {formatCompactMoney(datum.value, locale)}
                </div>
              )}
            </div>
            <span className="text-[0.7rem] font-medium text-muted-foreground">{datum.label}</span>
          </div>
        );
      })}
    </div>
  );
}
