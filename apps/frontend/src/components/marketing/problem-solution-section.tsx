import { BellRing, Link2, NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ProblemSolutionSection() {
  const t = useTranslations('landing.problem');

  const items = [
    { icon: NotebookPen, title: t('item1Title'), description: t('item1Description') },
    { icon: BellRing, title: t('item2Title'), description: t('item2Description') },
    { icon: Link2, title: t('item3Title'), description: t('item3Description') },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <h2 className="mx-auto max-w-2xl text-center font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {t('title')}
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="space-y-3 text-center sm:text-start">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary sm:mx-0">
              <item.icon className="size-5" strokeWidth={1.8} />
            </div>
            <h3 className="font-heading font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
