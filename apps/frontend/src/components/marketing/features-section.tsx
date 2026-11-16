import { BellRing, CalendarCheck, QrCode, ReceiptText, UsersRound, WalletCards } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HOME_SECTIONS } from '@/lib/home-sections';

const FEATURES = [
  { key: 'schedule', icon: CalendarCheck },
  { key: 'page', icon: QrCode },
  { key: 'reminders', icon: BellRing },
  { key: 'proofs', icon: ReceiptText },
  { key: 'wallets', icon: WalletCards },
  { key: 'team', icon: UsersRound },
] as const;

export function FeaturesSection() {
  const t = useTranslations('landing.features');

  return (
    <section id={HOME_SECTIONS[0].id} className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl space-y-4">
          <h2 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
            {t('title')}
          </h2>
          <p className="text-lead text-muted-foreground">{t('intro')}</p>
        </div>

        <ul className="mt-14 grid gap-x-12 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-4 border-b border-border py-8">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.9} />
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-semibold">{t(`${key}Title`)}</h3>
                <p className="leading-relaxed text-pretty text-muted-foreground">{t(`${key}Description`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
