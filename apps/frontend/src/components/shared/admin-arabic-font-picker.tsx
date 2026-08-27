'use client';

import { Check, Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ARABIC_FONT_VAR_MAP, useAdminArabicFont } from '@/lib/admin-arabic-font';
import { ARABIC_FONT_PRESETS } from '@/lib/schemas/admin-appearance';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const PREVIEW_TEXT = 'أبجد هوز';

export function AdminArabicFontPicker() {
  const t = useTranslations('arabicFont');
  const { arabicFont, setArabicFont } = useAdminArabicFont();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t('toggle')}>
            <Languages className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        {ARABIC_FONT_PRESETS.map((preset) => {
          const active = arabicFont === preset;
          return (
            <DropdownMenuItem key={preset} onClick={() => setArabicFont(preset)}>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm">{t(preset)}</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: ARABIC_FONT_VAR_MAP[preset] }}>
                  {PREVIEW_TEXT}
                </span>
              </span>
              <Check className={cn('ms-auto size-4 shrink-0 text-primary', active ? 'opacity-100' : 'opacity-0')} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
