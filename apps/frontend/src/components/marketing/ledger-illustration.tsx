import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  EXAMPLE_INSTALLMENT_AMOUNT,
  EXAMPLE_INSTALLMENT_COUNT,
  EXAMPLE_INSTALLMENTS,
  EXAMPLE_PAID_AMOUNT,
  EXAMPLE_PAID_COUNT,
  EXAMPLE_TOTAL_AMOUNT,
  STATUS_LABEL_KEYS,
  STATUS_STYLES,
} from '@/components/marketing/example-contract';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const FIRST_STAMP_DELAY_SECONDS = 0.35;
const STAMP_STAGGER_SECONDS = 0.18;

function stampDelay(index: number): React.CSSProperties {
  return { '--stamp-delay': `${FIRST_STAMP_DELAY_SECONDS + index * STAMP_STAGGER_SECONDS}s` } as React.CSSProperties;
}

export function LedgerIllustration({ className }: { className?: string }) {
  const t = useTranslations('landing.schedule');
  const locale = useLocale();

  return (
    <figure
      className={cn('w-full rounded-3xl bg-card text-card-foreground shadow-xl ring-1 ring-border', className)}
      role="img"
      aria-label={t('label')}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-semibold">{t('customerName')}</p>
          <p className="truncate text-sm text-muted-foreground">{t('product')}</p>
        </div>
        <p className="shrink-0 font-heading text-xl font-semibold tnums">{formatMoney(EXAMPLE_TOTAL_AMOUNT, locale)}</p>
      </div>

      <ol className="divide-y divide-border/70 px-6">
        {EXAMPLE_INSTALLMENTS.map((installment, index) => (
          <li key={installment.number} className="flex items-center justify-between gap-3 py-3">
            <span className={cn('text-sm', installment.status === 'upcoming' ? 'text-muted-foreground' : 'font-medium')}>
              {t('installmentNumber', { number: installment.number })}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-sm tnums text-muted-foreground">
                {formatMoney(EXAMPLE_INSTALLMENT_AMOUNT, locale)}
              </span>
              <span
                className={cn(
                  'inline-flex h-7 min-w-[4.75rem] items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold',
                  STATUS_STYLES[installment.status],
                  installment.status === 'paid' && 'animate-ledger-stamp',
                )}
                style={installment.status === 'paid' ? stampDelay(index) : undefined}
              >
                {installment.status === 'paid' && <Check aria-hidden className="size-3.5" strokeWidth={2.6} />}
                {t(STATUS_LABEL_KEYS[installment.status])}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 rounded-b-3xl border-t border-border bg-muted/50 px-6 py-5">
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-teal"
            style={{ width: `${(EXAMPLE_PAID_COUNT / EXAMPLE_INSTALLMENT_COUNT) * 100}%` }}
          />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('paid')}</p>
            <p className="font-heading text-lg font-semibold tnums">{formatMoney(EXAMPLE_PAID_AMOUNT, locale)}</p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t('progress', { paid: EXAMPLE_PAID_COUNT, total: EXAMPLE_INSTALLMENT_COUNT })}
          </p>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">{t('remaining')}</p>
            <p className="font-heading text-lg font-semibold tnums">
              {formatMoney(EXAMPLE_TOTAL_AMOUNT - EXAMPLE_PAID_AMOUNT, locale)}
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
