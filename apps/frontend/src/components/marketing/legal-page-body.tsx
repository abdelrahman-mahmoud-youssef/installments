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
    <article>
      <header className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
            {t('title')}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{t('lastUpdated')}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 lg:py-16">
        {sections.map((section) => (
          <section key={section} className="space-y-3">
            <h2 className="font-heading text-xl font-semibold tracking-tight rtl:tracking-normal">
              {t(`section${section}Title`)}
            </h2>
            <p className="max-w-[68ch] text-base leading-relaxed text-foreground/80 rtl:leading-loose">
              {t(`section${section}Body`, { email: config.contactEmail })}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
