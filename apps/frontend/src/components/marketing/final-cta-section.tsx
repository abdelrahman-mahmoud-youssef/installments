import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function FinalCtaSection() {
  const t = useTranslations('landing.finalCta');

  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 lg:py-20">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
            {t('title')}
          </h2>
          <p className="text-lead text-ink-foreground/75">{t('subtitle')}</p>
        </div>
        <Button
          size="xl"
          className="bg-ink-foreground text-ink shadow-none hover:bg-ink-foreground/90 focus-visible:ring-ink-foreground/50"
          render={<Link href={routes.register} />}
        >
          {t('cta')}
        </Button>
      </div>
    </section>
  );
}
