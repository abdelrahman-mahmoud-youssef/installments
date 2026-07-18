'use client';

import { Check, Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { value: 'ar', label: 'العربية', hint: 'AR' },
  { value: 'en', label: 'English', hint: 'EN' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Language">
            <Languages className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => router.replace(pathname, { locale: language.value })}
          >
            <span className="w-6 text-xs font-semibold text-muted-foreground">{language.hint}</span>
            <span>{language.label}</span>
            <Check
              className={cn(
                'ms-auto size-4 text-primary',
                locale === language.value ? 'opacity-100' : 'opacity-0',
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
