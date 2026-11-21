'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useJameyaMemberPayments } from '@/hooks/use-jameyas';
import { JameyaDetail, JameyaMember } from '@/lib/api/jameyas';
import { cn } from '@/lib/utils';
import { JameyaReceiptButton } from './jameya-receipt-button';
import { JameyaWhatsappButton } from './jameya-whatsapp-button';
import { useJameyaReceipts } from './use-jameya-receipts';

function MemberFigure({ label, minorUnits, isOwed = false }: { label: string; minorUnits: number; isOwed?: boolean }) {
  return (
    <div className="space-y-0.5 rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Money
        minorUnits={minorUnits}
        hideWholeDecimals
        className={cn('text-base font-semibold', isOwed && minorUnits > 0 && 'text-danger')}
      />
    </div>
  );
}

function MemberPayments({ jameya, member }: { jameya: JameyaDetail; member: JameyaMember }) {
  const t = useTranslations('jameyas.detail.member');
  const { data, isLoading, isError } = useJameyaMemberPayments(jameya.id, member.customerId);
  const { buildPaymentReceipt } = useJameyaReceipts(jameya);

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }
  if (isError || !data) {
    return <p className="text-sm text-muted-foreground">{t('paymentsLoadError')}</p>;
  }
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noPayments')}</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {data.map((payment) => (
        <li key={payment.id} className="flex items-center gap-3 py-2">
          <div className="min-w-0 flex-1">
            <DateText value={payment.paidAt} className="text-sm" />
            {payment.note && <p className="truncate text-xs text-muted-foreground">{payment.note}</p>}
          </div>
          <Money minorUnits={payment.amount} hideWholeDecimals className="text-sm font-semibold" />
          <JameyaReceiptButton
            fileName={`${jameya.name} ${member.name}`}
            buildContent={() =>
              buildPaymentReceipt({
                memberName: member.name,
                amount: payment.amount,
                paidAt: payment.paidAt,
                note: payment.note,
                balanceAfter: payment.balanceAfter,
              })
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function JameyaMemberSheet({
  jameya,
  customerId,
  onClose,
}: {
  jameya: JameyaDetail;
  customerId: string | null;
  onClose: () => void;
}) {
  const t = useTranslations('jameyas.detail.member');
  const tSection = useTranslations('jameyas.customerSection');
  const locale = useLocale();
  const member = jameya.members.find((item) => item.customerId === customerId);
  const sheetSide = locale === 'ar' ? 'left' : 'right';

  return (
    <Sheet open={member !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={sheetSide} className="w-full overflow-y-auto sm:max-w-md">
        {member && (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-3">
                <SheetTitle>{member.name}</SheetTitle>
                <JameyaWhatsappButton member={member} />
              </div>
              <SheetDescription>
                {member.turnSequences.length > 1
                  ? tSection('turnsValue', {
                      sequences: member.turnSequences.join(tSection('sequenceSeparator')),
                    })
                  : tSection('turnValue', { sequence: member.turnSequences[0] })}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <div className="grid grid-cols-2 gap-2">
                <MemberFigure label={t('paid')} minorUnits={member.paidAmount} />
                <MemberFigure label={t('owes')} minorUnits={member.dueNowAmount} isOwed />
                {member.lateAmount > 0 && <MemberFigure label={t('late')} minorUnits={member.lateAmount} isOwed />}
                <MemberFigure label={t('received')} minorUnits={member.receivedAmount} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t('payments')}</h3>
                <MemberPayments jameya={jameya} member={member} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
