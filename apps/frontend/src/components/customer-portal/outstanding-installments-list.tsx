'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SubmitPaymentDialog } from '@/components/customer-portal/submit-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { StatusBadge } from '@/components/shared/status-badge';
import { useRouter } from '@/i18n/navigation';
import { PublicOutstandingInstallment, PublicPaymentMethod } from '@/lib/api/public';

export function OutstandingInstallmentsList({
  installments,
  paymentMethods,
  publicId,
}: {
  installments: PublicOutstandingInstallment[];
  paymentMethods: PublicPaymentMethod[];
  publicId: string;
}) {
  const t = useTranslations('publicCustomer');
  const router = useRouter();
  const [activeInstallmentId, setActiveInstallmentId] = useState<string | null>(null);

  if (installments.length === 0) {
    return <p className="py-2 text-muted-foreground">{t('noOutstandingInstallments')}</p>;
  }

  const activeInstallment = installments.find((installment) => installment.id === activeInstallmentId) ?? null;

  return (
    <>
      <ul className="space-y-2">
        {installments.map((installment) => {
          const remaining = installment.amount - installment.paidAmount;
          return (
            <li key={installment.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{installment.productName}</span>
                <Money minorUnits={remaining} className="font-medium" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  #{installment.sequence} · <DateText value={installment.dueDate} />
                  {installment.isOverdue && <StatusBadge status="OVERDUE" />}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                {installment.latestClaim?.status === 'DECLINED' ? (
                  <span className="text-xs text-danger">
                    {t('claimDeclined', {
                      reason: installment.latestClaim.declineReason || t('claimDeclinedNoReason'),
                    })}
                  </span>
                ) : (
                  <span />
                )}
                {installment.latestClaim?.status === 'PENDING' ? (
                  <Badge variant="secondary">{t('claimPending')}</Badge>
                ) : paymentMethods.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveInstallmentId(installment.id)}
                  >
                    {t('submitPaymentButton')}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <SubmitPaymentDialog
        open={activeInstallment !== null}
        onOpenChange={(next) => {
          if (!next) {
            setActiveInstallmentId(null);
          }
        }}
        publicId={publicId}
        contractPublicId={activeInstallment?.contractPublicId ?? ''}
        installmentId={activeInstallment?.id ?? ''}
        amount={activeInstallment ? activeInstallment.amount - activeInstallment.paidAmount : 0}
        paymentMethods={paymentMethods}
        onSubmitted={() => {
          setActiveInstallmentId(null);
          router.refresh();
        }}
      />
    </>
  );
}
