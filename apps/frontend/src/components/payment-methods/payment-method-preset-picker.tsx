'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { PAYMENT_METHOD_PRESETS } from '@/lib/payment-method-presets';
import { PaymentMethodFormDialog } from './payment-method-form-dialog';

const INITIAL_VISIBLE_COUNT = 4;

export function PaymentMethodPresetPicker() {
  const t = useTranslations('paymentMethods');
  const [showAll, setShowAll] = useState(false);

  const hasMore = PAYMENT_METHOD_PRESETS.length > INITIAL_VISIBLE_COUNT;
  const visiblePresets = showAll ? PAYMENT_METHOD_PRESETS : PAYMENT_METHOD_PRESETS.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('paymentMethodPresetsLabel')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visiblePresets.map((preset) => (
          <PaymentMethodFormDialog
            key={preset.key}
            presetKey={preset.key}
            defaultLabel={preset.label}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
              >
                <PaymentMethodIcon presetKey={preset.key} className="size-6 shrink-0" />
                <span className="truncate">{preset.label}</span>
              </button>
            }
          />
        ))}
        {hasMore && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronDown className="size-4" />
            {t('showMore')}
          </button>
        )}
      </div>
    </div>
  );
}
