'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SubmitPaymentDialog } from '@/components/customer-portal/submit-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/shared/money';
import { useRouter } from '@/i18n/navigation';
import { PublicPaymentMethod } from '@/lib/api/public';

export function ContractPayAction({
  publicId,
  contractPublicId,
  amountDue,
  hasPendingClaim,
  paymentMethods,
}: {
  publicId: string;
  contractPublicId: string;
  amountDue: number;
  hasPendingClaim: boolean;
  paymentMethods: PublicPaymentMethod[];
}) {
  const t = useTranslations('publicCustomer');
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{t('submitPaymentAmount')}</span>
        <Money minorUnits={amountDue} className="text-lg font-semibold" />
      </div>

      {hasPendingClaim ? (
        <div className="flex justify-end">
          <Badge variant="secondary">{t('claimPending')}</Badge>
        </div>
      ) : (
        paymentMethods.length > 0 && (
          <Button type="button" className="w-full" onClick={() => setOpen(true)}>
            {t('submitPaymentButton')}
          </Button>
        )
      )}

      <SubmitPaymentDialog
        open={open}
        onOpenChange={setOpen}
        publicId={publicId}
        contractPublicId={contractPublicId}
        amount={amountDue}
        paymentMethods={paymentMethods}
        onSubmitted={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
