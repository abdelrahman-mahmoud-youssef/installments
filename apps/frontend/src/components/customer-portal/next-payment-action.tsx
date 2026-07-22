'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { useRouter } from '@/i18n/navigation';
import { PublicNextInstallment, PublicPaymentMethod } from '@/lib/api/public';
import { routes } from '@/lib/routes';

export function NextPaymentAction({
  nextInstallment,
  paymentMethods,
  publicId,
}: {
  nextInstallment: PublicNextInstallment;
  paymentMethods: PublicPaymentMethod[];
  publicId: string;
}) {
  const t = useTranslations('publicCustomer');
  const router = useRouter();

  const isPending = nextInstallment.latestClaim?.status === 'PENDING';
  const isPayable = !isPending && paymentMethods.length > 0;

  const info = (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {t('nextPayment')}
        {nextInstallment.isOverdue && <StatusBadge status="OVERDUE" />}
      </span>
      <span className="font-medium tabular-nums">
        <DateText value={nextInstallment.dueDate} /> · <Money minorUnits={nextInstallment.amount} />
      </span>
    </div>
  );

  const declinedNote = nextInstallment.latestClaim?.status === 'DECLINED' && (
    <p className="text-xs text-danger">
      {t('claimDeclined', {
        reason: nextInstallment.latestClaim.declineReason || t('claimDeclinedNoReason'),
      })}
    </p>
  );

  if (isPending) {
    return (
      <div className="space-y-2.5 border-t border-border pt-4 text-sm">
        {info}
        <div className="flex justify-end">
          <Badge variant="secondary">{t('claimPending')}</Badge>
        </div>
      </div>
    );
  }

  if (!isPayable) {
    return (
      <div className="space-y-2.5 border-t border-border pt-4 text-sm">
        {info}
        {declinedNote}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        router.push(routes.publicCustomerPay(publicId));
      }}
      className="block w-full space-y-2.5 border-t border-border pt-4 text-start text-sm"
    >
      {info}
      {declinedNote}
      <div className="flex items-center justify-between rounded-lg bg-primary px-3.5 py-2.5 font-medium text-primary-foreground transition-transform active:scale-[0.99]">
        {t('submitPaymentButton')}
        <ChevronRight className="size-4 rtl:rotate-180" />
      </div>
    </button>
  );
}
