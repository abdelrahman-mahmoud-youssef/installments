import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScheduleIllustration } from '@/components/marketing/schedule-illustration';
import { FadeIn } from '@/components/shared/motion';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-primary)/10%,transparent_70%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-8 lg:pt-28 lg:pb-28">
        <FadeIn className="space-y-7 text-center lg:text-start">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">{t('eyebrow')}</p>
          <h1 className="font-heading text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {t('title')}
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground text-pretty sm:text-xl lg:mx-0">
            {t('subtitle')}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button size="lg" className="h-12 px-6 text-base" render={<Link href={routes.register} />}>
              {t('ctaPrimary')}
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-6 text-base" render={<Link href={routes.login} />}>
              {t('ctaSecondary')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t('note')}</p>
        </FadeIn>

        <FadeIn delay={0.15} className="pt-6 lg:pt-0">
          <ScheduleIllustration />
        </FadeIn>
      </div>
    </section>
  );
}
