import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TrustSection() {
  const t = useTranslations('landing.trust');

  const points = [t('point1'), t('point2'), t('point3')];

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t('title')}
          </h2>
          <p className="leading-relaxed text-muted-foreground">{t('body')}</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
              <span className="text-foreground">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
