'use client';

import { ChevronDown, HandCoins } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { JameyaCycle, JameyaDetail, JameyaPayout } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import {
  canHandOverTurn,
  findCurrentTurn,
  holderNamesOf,
  JameyaTurnStatus,
  resolveTurnStatus,
  turnsAroundCurrent,
} from '@/lib/jameya-turns';
import { cn } from '@/lib/utils';
import { JameyaReceiptButton } from './jameya-receipt-button';
import { useJameyaReceipts } from './use-jameya-receipts';

type HandOver = (cycle: JameyaCycle) => void;

function payoutsWithRemaining(cycle: JameyaCycle): { payout: JameyaPayout; remainingAmount: number }[] {
  const paidSoFar = new Map<string, number>();
  return cycle.payouts.map((payout) => {
    const entitlement = cycle.holders.find((holder) => holder.customerId === payout.customerId)?.entitlementAmount ?? 0;
    const paid = (paidSoFar.get(payout.customerId) ?? 0) + payout.amount;
    paidSoFar.set(payout.customerId, paid);
    return { payout, remainingAmount: entitlement - paid };
  });
}

function TurnStatusText({ status }: { status: JameyaTurnStatus }) {
  const t = useTranslations('jameyas.detail.turnStatus');
  const locale = useLocale();
  if (status.kind === 'partlyPaidOut') {
    return (
      <span className="text-muted-foreground">
        {t('partlyPaidOut', {
          paid: formatMoney(status.paidOutAmount, locale, { hideWholeDecimals: true }),
          owed: formatMoney(status.owedAmount, locale, { hideWholeDecimals: true }),
        })}
      </span>
    );
  }
  return (
    <span className={cn(status.kind === 'current' ? 'font-semibold text-primary' : 'text-muted-foreground')}>
      {t(status.kind)}
    </span>
  );
}

function TurnPayouts({ jameya, cycle, onHandOver }: { jameya: JameyaDetail; cycle: JameyaCycle; onHandOver: HandOver }) {
  const t = useTranslations('jameyas.detail');
  const { canManageJameyas } = useJameyaAccess();
  const { buildPayoutReceipt } = useJameyaReceipts(jameya);
  const holderName = holderNamesOf(jameya, cycle);

  return (
    <div className="space-y-2 rounded-lg bg-muted/40 p-3">
      {cycle.payouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noPayouts')}</p>
      ) : (
        <ul className="space-y-1">
          {payoutsWithRemaining(cycle).map(({ payout, remainingAmount }) => (
            <li key={payout.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <DateText value={payout.paidAt} />
                </p>
                {payout.note && <p className="truncate text-xs text-muted-foreground">{payout.note}</p>}
              </div>
              <Money minorUnits={payout.amount} hideWholeDecimals className="text-sm font-semibold" />
              <JameyaReceiptButton
                fileName={`${jameya.name} ${holderName}`}
                buildContent={() => buildPayoutReceipt({ holderName, cycle, payout, remainingAmount })}
              />
            </li>
          ))}
        </ul>
      )}
      {canManageJameyas && canHandOverTurn(jameya, cycle) && (
        <Button variant="outline" size="sm" onClick={() => onHandOver(cycle)}>
          <HandCoins className="size-4" />
          {t('handOverPayout')}
        </Button>
      )}
    </div>
  );
}

function TurnRow({
  jameya,
  cycle,
  status,
  onHandOver,
  onOpenMember,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  status: JameyaTurnStatus;
  onHandOver: HandOver;
  onOpenMember: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas.detail');
  const [isOpen, setIsOpen] = useState(false);
  return (
    <li className="py-2">
      <div className="flex items-center gap-3 text-sm">
        <span className="w-6 shrink-0 text-muted-foreground tabular-nums">{cycle.sequence}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          {cycle.holders.map((holder) => (
            <button
              key={holder.customerId}
              type="button"
              onClick={() => onOpenMember(holder.customerId)}
              className="truncate font-medium hover:underline"
            >
              {jameya.members.find((member) => member.customerId === holder.customerId)?.name}
            </button>
          ))}
        </span>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={t('turnDetails', { sequence: cycle.sequence })}
          onClick={() => setIsOpen((current) => !current)}
          className="flex shrink-0 items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted"
        >
          <DateText value={cycle.dueDate} className="text-xs text-muted-foreground" />
          <TurnStatusText status={status} />
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>
      {isOpen && (
        <div className="mt-2">
          <TurnPayouts jameya={jameya} cycle={cycle} onHandOver={onHandOver} />
        </div>
      )}
    </li>
  );
}

export function JameyaTurnsList({
  jameya,
  onHandOver,
  onOpenMember,
}: {
  jameya: JameyaDetail;
  onHandOver: HandOver;
  onOpenMember: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas.detail');
  const [showAll, setShowAll] = useState(false);
  const current = findCurrentTurn(jameya);
  const nearby = turnsAroundCurrent(jameya);
  const cycles = showAll ? jameya.cycles : nearby;

  return (
    <Section title={t('turnsTitle')}>
      <div className="space-y-2">
        <ul className="divide-y divide-border">
          {cycles.map((cycle) => (
            <TurnRow
              key={cycle.id}
              jameya={jameya}
              cycle={cycle}
              status={resolveTurnStatus(cycle, current)}
              onHandOver={onHandOver}
              onOpenMember={onOpenMember}
            />
          ))}
        </ul>
        {nearby.length < jameya.cycles.length && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
            {showAll ? t('showFewerTurns') : t('showAllTurns')}
          </Button>
        )}
      </div>
    </Section>
  );
}
