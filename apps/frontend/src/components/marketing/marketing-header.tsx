'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

const NAV_LINKS = [
  { key: 'features', href: '#features' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'faq', href: '#faq' },
] as const;

export function MarketingHeader() {
  const t = useTranslations('landing.nav');
  const tCommon = useTranslations('common');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo label={tCommon('appName')} />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 sm:flex">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<Link href={routes.login} />}>
            {t('login')}
          </Button>
          <Button size="sm" render={<Link href={routes.register} />}>
            {t('cta')}
          </Button>
        </div>
      </div>
    </header>
  );
}
