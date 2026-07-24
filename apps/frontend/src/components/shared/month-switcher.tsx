'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { currentMonthKey, formatMonthYear, shiftMonthKey } from '@/lib/format';

export function MonthSwitcher({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const locale = useLocale();
  const isCurrentMonth = month === currentMonthKey();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(shiftMonthKey(month, -1))}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <span className="w-36 text-center text-sm font-medium tabular-nums">
        {formatMonthYear(month, locale)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(shiftMonthKey(month, 1))}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
