'use client';

import { Check, Type } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { FontSize, useAdminFontSize } from '@/lib/admin-font-size';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const OPTIONS: { value: FontSize; sizeClassName: string }[] = [
  { value: 'smaller', sizeClassName: 'text-xs' },
  { value: 'normal', sizeClassName: 'text-sm' },
  { value: 'bigger', sizeClassName: 'text-base' },
];

const noopSubscribe = () => () => {};

function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function AdminFontSizeToggle() {
  const t = useTranslations('fontSize');
  const { fontSize, setFontSize } = useAdminFontSize();
  const mounted = useHasMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t('toggle')}>
            <Type className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map((option) => {
          const active = mounted && fontSize === option.value;
          return (
            <DropdownMenuItem key={option.value} onClick={() => setFontSize(option.value)}>
              <span className={option.sizeClassName}>{t(option.value)}</span>
              <Check className={cn('ms-auto size-4 text-primary', active ? 'opacity-100' : 'opacity-0')} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
