import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function FinalCtaSection() {
  const t = useTranslations('landing.finalCta');

  return (
    <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-brand sm:px-12">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t('title')}</h2>
        <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">{t('subtitle')}</p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-7 bg-white text-foreground hover:bg-white/90"
          render={<Link href={routes.register} />}
        >
          {t('cta')}
        </Button>
      </div>
    </section>
  );
}
