'use client';

import { CalendarClock, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useJameyaPayments } from '@/hooks/use-jameyas';
import { JameyaDetail } from '@/lib/api/jameyas';
import { JameyaPaymentReceiptLink } from './jameya-payment-receipt-link';
import { JameyaReceiptButton } from './jameya-receipt-button';
import { useJameyaReceipts } from './use-jameya-receipts';

export function JameyaPaymentsHistory({ jameya }: { jameya: JameyaDetail }) {
  const t = useTranslations('jameyas.detail');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useJameyaPayments(jameya.id, page);
  const { buildPaymentReceipt } = useJameyaReceipts(jameya);
  const membersById = new Map(jameya.members.map((member) => [member.customerId, member]));

  return (
    <Section title={t('paymentHistory')}>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={CalendarClock} title={t('paymentsLoadError')} description={tCommon('tryAgain')} compact />
      ) : data.data.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t('noPayments')} compact />
      ) : (
        <div className="space-y-3">
          <ul className="space-y-1">
            {data.data.map((payment) => {
              const name = membersById.get(payment.customerId)?.name ?? '';
              return (
                <li key={payment.id} className="flex items-center gap-3 py-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <bdi>{name}</bdi> · <DateText value={payment.paidAt} />
                    </p>
                    {payment.note && <p className="truncate text-xs text-muted-foreground">{payment.note}</p>}
                  </div>
                  <Money minorUnits={payment.amount} hideWholeDecimals className="text-sm font-semibold text-success" />
                  <JameyaPaymentReceiptLink receiptUrl={payment.receiptUrl} />
                  <JameyaReceiptButton
                    fileName={`${jameya.name} ${name}`}
                    buildContent={() =>
                      buildPaymentReceipt({
                        memberName: name,
                        amount: payment.amount,
                        paidAt: payment.paidAt,
                        note: payment.note,
                        balanceAfter: payment.balanceAfter,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
          <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Section>
  );
}
