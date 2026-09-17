'use client';

import { useTranslations } from 'next-intl';
import { ScheduleIllustration } from '@/components/marketing/schedule-illustration';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

function BrandPanel() {
  const t = useTranslations('auth.brand');

  return (
    <aside className="relative hidden overflow-hidden bg-primary/6 lg:flex lg:w-[44%] lg:max-w-2xl lg:flex-col lg:justify-center lg:gap-12 lg:px-14 xl:px-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_100%,var(--color-primary)/14%,transparent_70%)]"
      />
      <div className="relative">
        <h2 className="font-heading text-4xl leading-tight font-semibold tracking-tight text-balance">
          {t('headline')}
        </h2>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">{t('subhead')}</p>
      </div>
      <ScheduleIllustration className="relative mx-0" />
    </aside>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('landing.footer');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link href={routes.home} aria-label={tCommon('appName')}>
            <Logo label={tCommon('appName')} />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="flex items-center justify-center gap-5 pb-1">
          <Link href={routes.privacy} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t('privacyLink')}
          </Link>
          <Link href={routes.terms} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t('termsLink')}
          </Link>
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}
