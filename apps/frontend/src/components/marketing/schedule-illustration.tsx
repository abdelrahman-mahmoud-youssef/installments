import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const INSTALLMENTS = [
  { amount: 45000, paid: true },
  { amount: 45000, paid: true },
  { amount: 45000, paid: true },
  { amount: 45000, paid: false },
  { amount: 45000, paid: false },
  { amount: 45000, paid: false },
] as const;

const PAID_COUNT = INSTALLMENTS.filter((installment) => installment.paid).length;
const TOTAL_AMOUNT = INSTALLMENTS.reduce((sum, installment) => sum + installment.amount, 0);
const PAID_AMOUNT = INSTALLMENTS.filter((installment) => installment.paid).reduce(
  (sum, installment) => sum + installment.amount,
  0,
);

export function ScheduleIllustration({ className }: { className?: string }) {
  const t = useTranslations('landing.schedule');
  const locale = useLocale();

  return (
    <div className={cn('relative mx-auto w-full max-w-sm', className)} role="img" aria-label={t('label')}>
      <div className="absolute inset-x-6 -top-5 h-full rounded-3xl bg-card/60 shadow-sm ring-1 ring-border/60" />
      <div className="absolute inset-x-3 -top-2.5 h-full rounded-3xl bg-card/80 shadow-sm ring-1 ring-border/70" />

      <div className="relative rounded-3xl bg-card p-6 shadow-lg ring-1 ring-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('customer')}</p>
            <p className="mt-1 truncate font-heading text-lg font-semibold">{t('customerName')}</p>
            <p className="truncate text-sm text-muted-foreground">{t('product')}</p>
          </div>
          <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            {t('onTrack')}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-1.5">
          {INSTALLMENTS.map((installment, index) => (
            <div
              key={index}
              className={cn(
                'flex h-12 flex-col items-center justify-center rounded-xl text-[0.7rem] font-semibold tabular-nums',
                installment.paid ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {installment.paid ? <Check className="size-3.5" /> : index + 1}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('paid')}</p>
            <p className="mt-0.5 font-heading text-2xl font-semibold tabular-nums">{formatMoney(PAID_AMOUNT, locale)}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">{t('remaining')}</p>
            <p className="mt-0.5 font-semibold tabular-nums text-muted-foreground">
              {formatMoney(TOTAL_AMOUNT - PAID_AMOUNT, locale)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-primary/6 px-4 py-3 text-sm">
          <span className="text-muted-foreground">{t('nextDue')}</span>
          <span className="font-semibold">
            {t('installmentOf', { current: PAID_COUNT + 1, total: INSTALLMENTS.length })}
          </span>
        </div>
      </div>
    </div>
  );
}
