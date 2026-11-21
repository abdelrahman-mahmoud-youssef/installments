'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { JameyaCycle, JameyaDetail } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import { dueKindOf, JameyaDueKind } from '@/lib/jameya-turns';
import { cn } from '@/lib/utils';
import { JameyaCollectDialog } from './jameya-collect-dialog';
import { JameyaWhatsappButton } from './jameya-whatsapp-button';

const DUE_KIND_TONE: Record<JameyaDueKind, string> = {
  paid: 'text-success',
  partial: 'text-muted-foreground',
  late: 'font-semibold text-danger',
  due: 'text-muted-foreground',
  upcoming: 'text-muted-foreground',
};

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
                {canRecord && <JameyaCollectDialog jameya={jameya} member={member} />}
                <JameyaWhatsappButton member={member} />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
