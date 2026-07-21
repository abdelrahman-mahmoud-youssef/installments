'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SubmitPaymentDialog } from '@/components/customer-portal/submit-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { PublicNextInstallment, PublicPaymentMethod } from '@/lib/api/public';

export function NextPaymentAction({
  nextInstallment,
  paymentMethods,
  publicId,
  contractPublicId,
}: {
  nextInstallment: PublicNextInstallment;
  paymentMethods: PublicPaymentMethod[];
  publicId: string;
  contractPublicId: string;
}) {
  const t = useTranslations('publicCustomer');
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (nextInstallment.latestClaim?.status === 'PENDING') {
    return <Badge variant="secondary">{t('claimPending')}</Badge>;
  }

  if (paymentMethods.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {t('submitPaymentButton')}
      </Button>
      <SubmitPaymentDialog
        open={open}
        onOpenChange={setOpen}
        publicId={publicId}
        contractPublicId={contractPublicId}
        installmentId={nextInstallment.id}
        amount={nextInstallment.amount}
        paymentMethods={paymentMethods}
        onSubmitted={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
