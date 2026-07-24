import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { StatusBadge } from '@/components/shared/status-badge';
import { Link } from '@/i18n/navigation';
import { PublicInstallment } from '@/lib/api/public';
import { routes } from '@/lib/routes';

export function UpcomingInstallments({
  installments,
  publicId,
  contractId,
}: {
  installments: PublicInstallment[];
  publicId: string;
  contractId: string;
}) {
  const t = useTranslations('publicCustomer');

  const outstanding = installments.filter(
    (installment) => installment.status === 'PENDING' || installment.status === 'PARTIALLY_PAID',
  );

  if (outstanding.length === 0) {
    return <p className="py-2 text-muted-foreground">{t('noUpcoming')}</p>;
  }

  return (
    <div className="space-y-3">
      <Link
        href={routes.publicCustomerPay(publicId, contractId)}
        className="flex items-center justify-between gap-1 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {t('makePaymentLink')}
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Link>
      <ul className="space-y-2">
        {outstanding.map((installment) => {
          const remaining = installment.amount - installment.paidAmount;
          return (
            <li key={installment.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  #{installment.sequence} · <DateText value={installment.dueDate} />
                  {installment.isOverdue && <StatusBadge status="OVERDUE" />}
                </span>
                <Money minorUnits={remaining} className="font-medium" />
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
                {installment.latestClaim?.status === 'PENDING' && (
                  <Badge variant="secondary">{t('claimPending')}</Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
