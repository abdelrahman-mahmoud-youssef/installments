import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6] as const;

export function FaqSection() {
  const t = useTranslations('landing.faq');

  return (
    <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h2 className="text-center font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t('title')}
      </h2>

      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQ_KEYS.map((key) => (
          <details key={key} className="group p-5 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading font-medium marker:content-none">
              {t(`q${key}`)}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`a${key}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
