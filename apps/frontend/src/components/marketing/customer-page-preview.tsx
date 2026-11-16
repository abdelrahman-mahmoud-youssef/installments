import { Check, Store } from 'lucide-react';
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

export function CustomerPagePreview() {
  const t = useTranslations('landing.product');
  const tSchedule = useTranslations('landing.schedule');
  const locale = useLocale();

  return (
    <div aria-hidden className="flex h-full flex-col gap-4 px-4 pt-10 pb-5 text-start">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Store className="size-4.5" />
        </span>
        <p className="font-heading text-sm font-semibold">{t('previewShop')}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t('previewGreeting')}</p>
        <p className="text-xs text-muted-foreground">{t('previewRemaining')}</p>
        <p className="font-heading text-2xl font-semibold tnums">
          {formatMoney(EXAMPLE_TOTAL_AMOUNT - EXAMPLE_PAID_AMOUNT, locale)}
        </p>
      </div>

      <div className="rounded-2xl bg-primary/8 p-3.5">
        <p className="text-xs text-muted-foreground">{t('previewNext')}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            {t('previewInstallment', { current: EXAMPLE_PAID_COUNT + 1, total: EXAMPLE_INSTALLMENT_COUNT })}
          </p>
          <p className="text-sm font-semibold tnums">{formatMoney(EXAMPLE_INSTALLMENT_AMOUNT, locale)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t('previewSchedule')}</p>
        <ol className="space-y-1.5">
          {EXAMPLE_INSTALLMENTS.map((installment) => (
            <li
              key={installment.number}
              className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-xs ring-1 ring-border"
            >
              <span className={cn(installment.status === 'upcoming' && 'text-muted-foreground')}>
                {tSchedule('installmentNumber', { number: installment.number })}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                  STATUS_STYLES[installment.status],
                )}
              >
                {installment.status === 'paid' && <Check className="size-3" strokeWidth={2.6} />}
                {tSchedule(STATUS_LABEL_KEYS[installment.status])}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
