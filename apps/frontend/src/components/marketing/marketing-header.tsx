'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { HOME_SECTIONS } from '@/lib/home-sections';
import { routes } from '@/lib/routes';

export function MarketingHeader() {
  const t = useTranslations('landing.nav');
  const tCommon = useTranslations('common');

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href={routes.home}
          className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <Logo label={tCommon('appName')} />
        </Link>

        <nav aria-label={t('menuLabel')} className="hidden items-center gap-1 md:flex">
          {HOME_SECTIONS.map((section) => (
            <Button
              key={section.key}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-sm text-muted-foreground"
              render={<Link href={`${routes.home}#${section.id}`} />}
            >
              {t(section.key)}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="lg" className="hidden px-4 sm:inline-flex" render={<Link href={routes.login} />}>
            {t('login')}
          </Button>
          <Button size="lg" className="px-4 sm:px-5" render={<Link href={routes.register} />}>
            {t('cta')}
          </Button>
        </div>
      </div>
    </header>
  );
}
