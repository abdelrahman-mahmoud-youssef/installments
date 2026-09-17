import { BellRing, CalendarCheck, Languages, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

const VALUE_PROPS = [
  { key: 'schedule', icon: CalendarCheck },
  { key: 'page', icon: QrCode },
  { key: 'reminders', icon: BellRing },
  { key: 'bilingual', icon: Languages },
] as const;

export function ValuePropsSection() {
  const t = useTranslations('landing.valueProps');

  return (
    <section id="features" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">{t('eyebrow')}</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-border ring-1 ring-border sm:grid-cols-2">
          {VALUE_PROPS.map(({ key, icon: Icon }) => (
            <div key={key} className="bg-card p-7 sm:p-9">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/8 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-6 font-heading text-xl font-semibold">{t(`${key}Title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${key}Description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
