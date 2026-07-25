'use client';

import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Language"
      className="text-xs font-semibold"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
    >
      {locale.toUpperCase()}
    </Button>
  );
}
