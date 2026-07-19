import { useTranslations } from 'next-intl';
import { DashboardPreview } from '@/components/marketing/dashboard-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const tBadges = useTranslations('landing.badges');

  const badges = [tBadges('bilingual'), tBadges('reminders'), tBadges('branding')];

  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28 lg:px-8">
        <div className="space-y-6 text-center lg:text-start">
          <Badge variant="secondary" className="h-auto px-3 py-1 text-xs font-medium">
            {t('badge')}
          </Badge>
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance lg:mx-0">{t('subtitle')}</p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button size="lg" render={<Link href={routes.register} />}>
              {t('ctaPrimary')}
            </Button>
            <Button size="lg" variant="outline" render={<Link href={routes.login} />}>
              {t('ctaSecondary')}
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-sm text-muted-foreground lg:justify-start">
            {badges.map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-success" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <DashboardPreview ariaLabel={t('imageAlt')} />
        </div>
      </div>
    </section>
  );
}
