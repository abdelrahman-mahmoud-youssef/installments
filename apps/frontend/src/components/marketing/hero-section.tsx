import { useTranslations } from 'next-intl';
import { IosAppNotice } from '@/components/marketing/ios-app-notice';
import { LedgerIllustration } from '@/components/marketing/ledger-illustration';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="border-b border-border/70">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-8 lg:pt-24 lg:pb-24">
        <div className="space-y-7">
          <h1 className="font-heading text-display font-semibold tracking-tight text-balance text-ink dark:text-foreground rtl:leading-[1.22] rtl:tracking-normal">
            <span className="block">{t('titleFirst')}</span> <span className="block">{t('titleSecond')}</span>
          </h1>
          <p className="max-w-xl text-lead text-pretty text-muted-foreground">{t('subtitle')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="xl" render={<Link href={routes.register} />}>
              {t('ctaPrimary')}
            </Button>
            <Button size="xl" variant="outline" render={<Link href={routes.login} />}>
              {t('ctaSecondary')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('note')}</p>
          <IosAppNotice />
        </div>

        <LedgerIllustration className="mx-auto max-w-md lg:max-w-none" />
      </div>
    </section>
  );
}
