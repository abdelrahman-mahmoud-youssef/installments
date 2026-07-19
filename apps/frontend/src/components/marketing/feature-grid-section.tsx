import { Bell, LayoutDashboard, Languages, Palette, QrCode, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeatureGridSection() {
  const t = useTranslations('landing.features');

  const features = [
    { icon: User, title: t('portalTitle'), description: t('portalDescription') },
    { icon: QrCode, title: t('shareTitle'), description: t('shareDescription') },
    { icon: LayoutDashboard, title: t('dashboardTitle'), description: t('dashboardDescription') },
    { icon: Palette, title: t('brandingTitle'), description: t('brandingDescription') },
    { icon: Languages, title: t('bilingualTitle'), description: t('bilingualDescription') },
    { icon: Bell, title: t('remindersTitle'), description: t('remindersDescription') },
  ];

  return (
    <section id="features" className="scroll-mt-20 bg-muted/30 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-2xl text-center font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t('title')}
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" strokeWidth={1.8} />
              </div>
              <h3 className="mt-4 font-heading font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
