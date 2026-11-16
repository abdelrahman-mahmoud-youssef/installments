'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <Button
      variant="ghost"
      size="sm"
      lang={nextLocale}
      className="min-w-9 px-2.5 font-semibold"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
    >
      {t('otherLanguage')}
    </Button>
  );
}
