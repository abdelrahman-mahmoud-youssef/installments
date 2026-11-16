'use client';

import { useTranslations } from 'next-intl';
import { LedgerIllustration } from '@/components/marketing/ledger-illustration';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

const FOOTER_LINK_CLASS =
  'rounded-sm py-1 text-sm text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45';

function BrandPanel() {
  const t = useTranslations('auth.brand');

  return (
    <aside className="hidden bg-ink text-ink-foreground lg:flex lg:w-[46%] lg:max-w-2xl lg:flex-col lg:justify-center lg:gap-12 lg:px-14 xl:px-20">
      <div>
        <h2 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
          {t('headline')}
        </h2>
        <p className="mt-4 max-w-md text-lead text-ink-foreground/75">{t('subhead')}</p>
      </div>
      <LedgerIllustration />
    </aside>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('landing.footer');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href={routes.home} className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
            <Logo label={tCommon('appName')} />
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 justify-center pt-10 pb-12 sm:items-center sm:py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link href={routes.privacy} className={FOOTER_LINK_CLASS}>
            {t('privacyLink')}
          </Link>
          <Link href={routes.terms} className={FOOTER_LINK_CLASS}>
            {t('termsLink')}
          </Link>
          <Link href={routes.publicContact} className={FOOTER_LINK_CLASS}>
            {t('contactLink')}
          </Link>
        </footer>
      </div>
      <BrandPanel />
    </div>
  );
}
