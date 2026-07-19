import { useTranslations } from 'next-intl';

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  const steps = [
    { title: t('step1Title'), description: t('step1Description') },
    { title: t('step2Title'), description: t('step2Description') },
    { title: t('step3Title'), description: t('step3Description') },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h2 className="mx-auto max-w-2xl text-center font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t('title')}
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="text-center sm:text-start">
            <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="mt-4 font-heading font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
