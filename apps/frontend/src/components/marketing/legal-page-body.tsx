import type { getTranslations } from 'next-intl/server';
import { config } from '@/lib/config';

type LegalTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface LegalPageBodyProps {
  t: LegalTranslator;
  sectionCount: number;
}

export function LegalPageBody({ t, sectionCount }: LegalPageBodyProps) {
  const sections = Array.from({ length: sectionCount }, (_, index) => index + 1);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('lastUpdated')}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section} className="space-y-2">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {t(`section${section}Title`)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`section${section}Body`, { email: config.contactEmail })}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
