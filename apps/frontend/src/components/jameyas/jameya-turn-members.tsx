'use client';

import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { NumberInput } from '@/components/shared/number-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCreateJameyaPayment } from '@/hooks/use-jameyas';
import { ApiError } from '@/lib/api/client';
import { JameyaCycle, JameyaDetail, JameyaMember } from '@/lib/api/jameyas';
import { formatMoney, toMajorUnits, toMinorUnits, todayIso } from '@/lib/format';
import { dueKindOf, JameyaDueKind, suggestedPaymentOf } from '@/lib/jameya-turns';
import { cn } from '@/lib/utils';
import { JameyaWhatsappButton } from './jameya-whatsapp-button';

const DUE_KIND_TONE: Record<JameyaDueKind, string> = {
  paid: 'text-success',
  partial: 'text-muted-foreground',
  late: 'font-semibold text-danger',
  due: 'text-muted-foreground',
  upcoming: 'text-muted-foreground',
};

function QuickPayment({ jameya, member }: { jameya: JameyaDetail; member: JameyaMember }) {
  const t = useTranslations('jameyas');
  const locale = useLocale();
  const createPayment = useCreateJameyaPayment(jameya.id);
  const suggested = suggestedPaymentOf(jameya, member.customerId);
  const [amount, setAmount] = useState<number | undefined>(suggested > 0 ? toMajorUnits(suggested) : undefined);
  const [clientRequestId] = useState(() => crypto.randomUUID());

  async function record() {
    const minorUnits = amount === undefined ? 0 : toMinorUnits(amount);
    if (minorUnits <= 0) {
      toast.error(t('validation.amountPositive'));
      return;
    }
    if (minorUnits > member.remainingAmount) {
      toast.error(t('validation.amountAboveLimit'));
      return;
    }
    try {
      await createPayment.mutateAsync({
        customerId: member.customerId,
        amount: minorUnits,
        paidAt: todayIso(),
        clientRequestId,
      });
      toast.success(t('paymentDialog.recorded'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('paymentDialog.recordError'));
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <NumberInput
        step="0.01"
        min="0"
        value={amount}
        onChange={setAmount}
        aria-label={t('detail.amountFor', { name: member.name })}
        className="h-8 w-24"
      />
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="outline" disabled={createPayment.isPending}>
            {createPayment.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('detail.recordShort')}
          </Button>
        }
        title={t('detail.confirmPaymentTitle')}
        description={t('detail.confirmPaymentDescription', {
          amount: formatMoney(amount === undefined ? 0 : toMinorUnits(amount), locale, { hideWholeDecimals: true }),
          name: member.name,
        })}
        confirmLabel={t('detail.recordShort')}
        onConfirm={record}
      />
    </div>
  );
}

export function JameyaTurnMembers({
  jameya,
  cycle,
  canRecord,
  onOpenMember,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  canRecord: boolean;
  onOpenMember: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas');
  const locale = useLocale();
  const holderIds = new Set(cycle.holders.map((holder) => holder.customerId));
  const owedThisTurnOf = (customerId: string) => {
    const due = jameya.dues.find((item) => item.cycleId === cycle.id && item.customerId === customerId);
    return due ? due.amount - due.paidAmount : 0;
  };
  const sortRank = (customerId: string) =>
    (owedThisTurnOf(customerId) > 0 ? 0 : 2) + (holderIds.has(customerId) ? 0 : 1);
  const members = [...jameya.members].sort(
    (first, second) => sortRank(first.customerId) - sortRank(second.customerId),
  );

  return (
    <ul className="divide-y divide-border">
      {members.map((member) => {
        const due = jameya.dues.find((item) => item.cycleId === cycle.id && item.customerId === member.customerId);
        const kind = due ? dueKindOf(due, cycle) : null;
        const owedThisTurn = owedThisTurnOf(member.customerId);
        return (
          <li key={member.customerId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenMember(member.customerId)}
                className="truncate text-start text-sm font-medium hover:underline"
              >
                {member.name}
              </button>
              {holderIds.has(member.customerId) && <Badge>{t('detail.getsPaid')}</Badge>}
            </div>
            {kind && (
              <span className={cn('text-sm', DUE_KIND_TONE[kind])}>
                {kind === 'paid' || owedThisTurn === 0
                  ? t(`grid.cell.${kind}`)
                  : `${t(`grid.cell.${kind}`)} · ${formatMoney(owedThisTurn, locale, { hideWholeDecimals: true })}`}
              </span>
            )}
            {owedThisTurn > 0 && (
              <>
                {canRecord && <QuickPayment key={member.remainingAmount} jameya={jameya} member={member} />}
                <JameyaWhatsappButton member={member} />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
