'use client';

import { Copy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CurrentUserSubscription } from '@/lib/api/auth';
import { formatMoney } from '@/lib/format';

function CopyableValue({
  label,
  value,
  copyLabel,
  copiedMessage,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedMessage: string;
}) {
  function handleCopy() {
    void navigator.clipboard.writeText(value);
    toast.success(copiedMessage);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 ring-1 ring-border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p dir="ltr" className="truncate text-start font-mono text-sm font-medium">
          {value}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label={copyLabel}>
        <Copy className="size-4" />
      </Button>
    </div>
  );
}

export function PaymentInstructions({ subscription }: { subscription: CurrentUserSubscription }) {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const price = formatMoney(subscription.monthlyPrice, locale);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium">{t('howToPay')}</p>
      <ol className="list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
        <li>{t('stepTransfer', { price })}</li>
        <li>{t('stepSendReceipt')}</li>
        <li>{t('stepActivation')}</li>
      </ol>
      <div className="space-y-2">
        <CopyableValue
          label={t('instapayPhone')}
          value={subscription.paymentPhone}
          copyLabel={t('copyPhone')}
          copiedMessage={t('phoneCopied')}
        />
        <CopyableValue
          label={t('instapayAddress')}
          value={subscription.paymentAddress}
          copyLabel={t('copyAddress')}
          copiedMessage={t('addressCopied')}
        />
      </div>
    </div>
  );
}
