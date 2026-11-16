import { Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { config } from '@/lib/config';

export default async function ContactPage() {
  const t = await getTranslations('contactPage');

  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-xl text-lead text-pretty text-muted-foreground">{t('description')}</p>
        <p className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t('emailLabel')}</span>{' '}
          <a
            href={`mailto:${config.contactEmail}`}
            dir="ltr"
            className="inline-flex min-h-11 items-center gap-2.5 rounded-xl text-lg font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45"
          >
            <Mail aria-hidden className="size-5" />
            {config.contactEmail}
          </a>
        </p>
      </section>
    </MarketingShell>
  );
}
