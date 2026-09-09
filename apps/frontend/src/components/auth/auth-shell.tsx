'use client';

import { ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { LogoMark } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/i18n/navigation';
import { formatMoney } from '@/lib/format';
import { routes } from '@/lib/routes';

function BrandPanel() {
  const t = useTranslations('auth.brand');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const points = [
    { icon: Wallet, text: t('point1') },
    { icon: TrendingUp, text: t('point2') },
    { icon: ShieldCheck, text: t('point3') },
  ];

  return (
    <div className="relative hidden overflow-hidden bg-[oklch(0.28_0.1_260)] lg:flex lg:w-[46%] lg:max-w-2xl">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 0%, oklch(0.6 0.18 260 / 0.5), transparent 55%), radial-gradient(90% 80% at 100% 100%, oklch(0.55 0.12 203 / 0.6), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-8 ring-1 ring-inset ring-white/25" />
          <span className="text-[0.95rem] font-semibold tracking-tight">{tCommon('appName')}</span>
        </div>

        <div className="space-y-8">
          <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 shadow-xl ring-1 ring-inset ring-white/20 backdrop-blur-md">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/70">{t('cardLabel')}</span>
              <span className="font-heading text-2xl font-semibold tabular-nums">78%</span>
            </div>
            <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {[1, 1, 1, 1, 0.5, 0, 0, 0].map((fill, index) => (
                <div key={index} className="h-full flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${fill * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/60">{t('cardCollected')}</p>
                <p className="mt-0.5 font-semibold tabular-nums">{formatMoney(1248000, locale)}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/60">{t('cardRemaining')}</p>
                <p className="mt-0.5 font-semibold tabular-nums">{formatMoney(352000, locale)}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-[2rem] leading-tight font-semibold">{t('headline')}</h2>
            <p className="mt-3 max-w-md text-white/70">{t('subhead')}</p>
          </div>

          <ul className="space-y-3">
            {points.map((point, index) => {
              const Icon = point.icon;
              return (
                <li key={index} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15">
                    <Icon className="size-4" />
                  </span>
                  {point.text}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-sm text-white/50">{t('footer')}</p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('landing.footer');

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="flex items-center justify-center gap-4 pb-2">
          <Link href={routes.privacy} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t('privacyLink')}
          </Link>
          <Link href={routes.terms} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            {t('termsLink')}
          </Link>
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}
