import { useTranslations } from 'next-intl';

const STEPS = ['step1', 'step2', 'step3'] as const;

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">{t('eyebrow')}</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => (
            <li key={step} className="relative">
              <span className="font-heading text-6xl font-semibold text-primary/20 tabular-nums">{index + 1}</span>
              <h3 className="mt-2 font-heading text-xl font-semibold">{t(`${step}Title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${step}Description`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
