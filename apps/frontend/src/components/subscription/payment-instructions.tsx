'use client';

import { Gift } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { InviteLinkField } from '@/components/referrals/invite-link-field';
import { CopyableValue } from '@/components/shared/copyable-value';
import { CurrentUserSubscription } from '@/lib/api/auth';
import { formatMoney } from '@/lib/format';

export function PaymentInstructions({
  subscription,
  shopSlug,
}: {
  subscription: CurrentUserSubscription;
  shopSlug: string;
}) {
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
      <CopyableValue
        label={t('instapayPhone')}
        value={subscription.paymentPhone}
        copyLabel={t('copyPhone')}
        copiedMessage={t('phoneCopied')}
      />
      <div className="space-y-2 rounded-md bg-primary/5 p-3 ring-1 ring-primary/20">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{t('referralOffer', { price: formatMoney(subscription.referralMonthlyPrice, locale) })}</span>
        </p>
        <InviteLinkField shopSlug={shopSlug} />
      </div>
    </div>
  );
}
