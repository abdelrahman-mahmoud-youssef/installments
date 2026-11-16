import { getTranslations } from 'next-intl/server';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { config } from '@/lib/config';

export default async function ContactPage() {
  const t = await getTranslations('contactPage');

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t('description')}</p>
          <p className="mt-6 text-sm">
            <span className="text-muted-foreground">{t('emailLabel')}</span>{' '}
            <a href={`mailto:${config.contactEmail}`} dir="ltr" className="font-medium text-primary hover:underline">
              {config.contactEmail}
            </a>
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
