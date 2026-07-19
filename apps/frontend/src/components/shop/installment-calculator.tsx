'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { NumberInput } from '@/components/shared/number-input';
import type { CalculatorPlan } from '@/lib/api/branding';
import { formatMoney, toMinorUnits } from '@/lib/format';
import { estimateMarkupInstallment } from '@/lib/markup-estimate';
import { cn } from '@/lib/utils';

export function InstallmentCalculator({ plans, locale }: { plans: CalculatorPlan[]; locale: string }) {
  const t = useTranslations('publicShop');
  const [productPrice, setProductPrice] = useState<number | undefined>(undefined);
  const [downPayment, setDownPayment] = useState<number | undefined>(undefined);
  const [selectedMonths, setSelectedMonths] = useState(plans[0]?.months);

  const selectedPlan = plans.find((plan) => plan.months === selectedMonths) ?? plans[0];

  const priceMinor = toMinorUnits(productPrice ?? 0);
  const downMinor = toMinorUnits(downPayment ?? 0);
  const { monthlyPaymentMinor } = estimateMarkupInstallment({
    productPriceMinor: priceMinor,
    downPaymentMinor: downMinor,
    markupPercent: selectedPlan?.markupPercent ?? 0,
    months: selectedPlan?.months ?? 1,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">{t('calculatorProductPrice')}</p>
          <NumberInput step="1" min="0" value={productPrice} onChange={setProductPrice} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">{t('calculatorDownPayment')}</p>
          <NumberInput step="1" min="0" value={downPayment} onChange={setDownPayment} />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">{t('calculatorPlan')}</p>
        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => (
            <button
              key={plan.months}
              type="button"
              aria-pressed={selectedMonths === plan.months}
              onClick={() => setSelectedMonths(plan.months)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                selectedMonths === plan.months
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent',
              )}
            >
              {t('calculatorMonths', { count: plan.months })}
            </button>
          ))}
        </div>
      </div>

      {priceMinor > 0 && (
        <div className="rounded-xl bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">{t('calculatorMonthlyPayment')}</p>
          <p className="mt-0.5 font-heading text-2xl font-semibold tabular-nums text-primary">
            {formatMoney(monthlyPaymentMinor, locale)}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('calculatorEstimateNote')}</p>
    </div>
  );
}
