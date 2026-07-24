'use client';

import { useTranslations } from 'next-intl';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { PAYMENT_METHOD_PRESETS } from '@/lib/payment-method-presets';
import { PaymentMethodFormDialog } from './payment-method-form-dialog';

export function PaymentMethodPresetPicker() {
  const t = useTranslations('paymentMethods');

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('paymentMethodPresetsLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_METHOD_PRESETS.map((preset) => (
          <PaymentMethodFormDialog
            key={preset.key}
            presetKey={preset.key}
            defaultLabel={preset.label}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border bg-card py-1 ps-1.5 pe-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
              >
                <PaymentMethodIcon presetKey={preset.key} className="size-6" />
                {preset.label}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
