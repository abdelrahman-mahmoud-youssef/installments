'use client';

import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps {
  value: string;
  onChange: (isoDate: string) => void;
  onBlur?: () => void;
  max?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePickerField({ value, onChange, onBlur, max, min, placeholder, disabled, className }: DatePickerFieldProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const dayPickerLocale = locale === 'ar' ? ar : enUS;

  const selected = value ? parseISO(value) : undefined;
  const maxDate = max ? parseISO(max) : undefined;
  const minDate = min ? parseISO(min) : undefined;
  const disabledMatchers = [maxDate && { after: maxDate }, minDate && { before: minDate }].filter(Boolean) as (
    | { after: Date }
    | { before: Date }
  )[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
            onBlur={onBlur}
          >
            <CalendarIcon className="size-4" />
            {selected ? format(selected, 'dd/MM/yyyy') : (placeholder ?? t('pickDate'))}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toIsoDate(date));
              setOpen(false);
            }
          }}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          locale={dayPickerLocale}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
