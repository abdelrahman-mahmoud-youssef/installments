import { useLocale, useTranslations } from 'next-intl';
import { HOME_SECTIONS } from '@/lib/home-sections';

const STEPS = ['step1', 'step2', 'step3'] as const;

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  const locale = useLocale();
  const formatStep = new Intl.NumberFormat(locale, { numberingSystem: 'latn' });

  return (
    <section id={HOME_SECTIONS[1].id} className="scroll-mt-20 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2 className="max-w-2xl font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
          {t('title')}
        </h2>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step} className="relative flex gap-5 md:flex-col md:gap-6">
              <span
                aria-hidden
                className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-ink font-heading text-base font-semibold text-ink-foreground tnums"
              >
                {formatStep.format(index + 1)}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute start-[1.375rem] top-11 bottom-[-2.5rem] w-px bg-border md:start-14 md:end-[-2rem] md:top-[1.375rem] md:bottom-auto md:h-px md:w-auto"
                />
              )}
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-semibold">{t(`${step}Title`)}</h3>
                <p className="leading-relaxed text-pretty text-muted-foreground">{t(`${step}Description`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
