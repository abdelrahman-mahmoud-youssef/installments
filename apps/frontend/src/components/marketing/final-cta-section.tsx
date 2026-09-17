import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function FinalCtaSection() {
  const t = useTranslations('landing.finalCta');

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">{t('subtitle')}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 h-12 px-6 text-base"
            render={<Link href={routes.register} />}
          >
            {t('cta')}
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </Button>
        </div>
      </div>
    </section>
  );
}
