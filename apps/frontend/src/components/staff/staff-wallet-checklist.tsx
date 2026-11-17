'use client';

import { useTranslations } from 'next-intl';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethods } from '@/hooks/use-payment-methods';

const SKELETON_ROW_COUNT = 3;

export function StaffWalletChecklist({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const t = useTranslations('staff');
  const { data: paymentMethods, isLoading, isError } = usePaymentMethods();

  function handleToggle(paymentMethodId: string, isChecked: boolean) {
    onChange(
      isChecked ? [...selectedIds, paymentMethodId] : selectedIds.filter((selectedId) => selectedId !== paymentMethodId),
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !paymentMethods) {
    return <p className="text-sm text-muted-foreground">{t('walletsLoadError')}</p>;
  }

  if (paymentMethods.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noWalletsYet')}</p>;
  }

  return (
    <div className="max-h-60 space-y-2 overflow-y-auto">
      {paymentMethods.map((method) => (
        <label
          key={method.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(method.id)}
            onChange={(event) => handleToggle(method.id, event.target.checked)}
            className="size-4 accent-primary"
          />
          <PaymentMethodIcon presetKey={method.presetKey} iconKey={method.iconKey} className="size-6 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{method.label}</span>
          {!method.isActive && <span className="text-xs text-muted-foreground">{t('walletInactive')}</span>}
        </label>
      ))}
    </div>
  );
}
