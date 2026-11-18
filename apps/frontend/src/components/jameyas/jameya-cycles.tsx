'use client';

import { HandCoins, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { JameyaCycle, JameyaDetail, JameyaPayout } from '@/lib/api/jameyas';
import { cn } from '@/lib/utils';
import { JameyaReceiptButton } from './jameya-receipt-button';
import { RecordJameyaPaymentDialog } from './record-jameya-payment-dialog';
import { useJameyaReceipts } from './use-jameya-receipts';

function canHandOver(jameya: JameyaDetail, cycle: JameyaCycle): boolean {
  return (
    jameya.status === 'ACTIVE' &&
    cycle.state !== 'UPCOMING' &&
    cycle.holders.some((holder) => holder.remainingAmount > 0)
  );
}

function memberName(jameya: JameyaDetail, customerId: string): string {
  return jameya.members.find((member) => member.customerId === customerId)?.name ?? '';
}

function Figure({ label, minorUnits, className }: { label: string; minorUnits: number; className?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Money minorUnits={minorUnits} className={cn('text-sm font-semibold', className)} />
    </div>
  );
}

type StartPayout = (cycle: JameyaCycle) => void;

function PayoutButton({ cycle, onHandOver }: { cycle: JameyaCycle; onHandOver: StartPayout }) {
  const t = useTranslations('jameyas.detail');
  return (
    <Button variant="outline" size="sm" onClick={() => onHandOver(cycle)}>
      <HandCoins className="size-4" />
      {t('handOverPayout')}
    </Button>
  );
}

function CycleFigures({ cycle }: { cycle: JameyaCycle }) {
  const t = useTranslations('jameyas.detail');
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Figure label={t('pot')} minorUnits={cycle.potAmount} />
      <Figure label={t('collected')} minorUnits={cycle.collectedAmount} className="text-success" />
      <Figure label={t('paidOut')} minorUnits={cycle.paidOutAmount} />
      <Figure
        label={t('shopCovered')}
        minorUnits={cycle.exposureAmount}
        className={cycle.exposureAmount > 0 ? 'text-warning' : undefined}
      />
    </div>
  );
}

function payoutsWithRemaining(cycle: JameyaCycle): { payout: JameyaPayout; remainingAmount: number }[] {
  const paidSoFar = new Map<string, number>();
  return cycle.payouts.map((payout) => {
    const entitlement = cycle.holders.find((holder) => holder.customerId === payout.customerId)?.entitlementAmount ?? 0;
    const paid = (paidSoFar.get(payout.customerId) ?? 0) + payout.amount;
    paidSoFar.set(payout.customerId, paid);
    return { payout, remainingAmount: entitlement - paid };
  });
}

function CycleRow({
  jameya,
  cycle,
  onHandOver,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  onHandOver: StartPayout;
}) {
  const t = useTranslations('jameyas.detail');
  const { canManageJameyas } = useJameyaAccess();
  const { buildPayoutReceipt } = useJameyaReceipts(jameya);

  return (
    <li className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-sm font-semibold">{t('turnLabel', { sequence: cycle.sequence })}</span>
          <StatusBadge status={cycle.state} />
          <span className="text-xs text-muted-foreground">
            <DateText value={cycle.dueDate} /> · {t('lateAfter')} <DateText value={cycle.lateAfter} />
          </span>
        </div>
        {canManageJameyas && canHandOver(jameya, cycle) && <PayoutButton cycle={cycle} onHandOver={onHandOver} />}
      </div>

      <div className="space-y-2">
        {cycle.holders.map((holder) => (
          <div
            key={holder.customerId}
            className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-4"
          >
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('holder')}</p>
              <p className="truncate text-sm font-semibold">{memberName(jameya, holder.customerId)}</p>
            </div>
            <Figure label={t('entitlement')} minorUnits={holder.entitlementAmount} />
            <Figure label={t('paidOut')} minorUnits={holder.paidOutAmount} />
            <Figure
              label={t('remainingForTurn')}
              minorUnits={holder.remainingAmount}
              className={holder.remainingAmount === 0 ? 'text-success' : undefined}
            />
          </div>
        ))}
      </div>

      <CycleFigures cycle={cycle} />

      {cycle.payouts.length > 0 && (
        <ul className="space-y-1">
          {payoutsWithRemaining(cycle).map(({ payout, remainingAmount }) => (
            <li key={payout.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Receipt className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  <DateText value={payout.paidAt} /> · <bdi>{memberName(jameya, payout.customerId)}</bdi>
                </p>
                {payout.note && <p className="truncate text-xs text-muted-foreground">{payout.note}</p>}
                {payout.coveredAmount > 0 && (
                  <p className="text-xs text-warning">
                    {t('payoutCovered')} <Money minorUnits={payout.coveredAmount} />
                  </p>
                )}
              </div>
              <Money minorUnits={payout.amount} className="text-sm font-semibold" />
              <JameyaReceiptButton
                fileName={`${jameya.name} ${memberName(jameya, payout.customerId)}`}
                buildContent={() =>
                  buildPayoutReceipt({
                    holderName: memberName(jameya, payout.customerId),
                    cycle,
                    payout,
                    remainingAmount,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function JameyaCyclesList({ jameya, onHandOver }: { jameya: JameyaDetail; onHandOver: StartPayout }) {
  const t = useTranslations('jameyas.detail');
  return (
    <Section title={t('cycles')}>
      <ul className="divide-y divide-border">
        {jameya.cycles.map((cycle) => (
          <CycleRow key={cycle.id} jameya={jameya} cycle={cycle} onHandOver={onHandOver} />
        ))}
      </ul>
    </Section>
  );
}

export function JameyaCurrentCyclePanel({ jameya, onHandOver }: { jameya: JameyaDetail; onHandOver: StartPayout }) {
  const t = useTranslations('jameyas.detail');
  const { canManageJameyas } = useJameyaAccess();
  const cycle = jameya.cycles.find((item) => item.state !== 'SETTLED');

  if (!cycle) {
    return (
      <Section title={t('currentCycle')}>
        <p className="text-sm text-muted-foreground">{t('allSettled')}</p>
      </Section>
    );
  }

  const isActive = jameya.status === 'ACTIVE';

  return (
    <Section
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t('currentCycleTitle', { sequence: cycle.sequence })}
          <StatusBadge status={cycle.state} />
        </span>
      }
      description={
        <>
          {t('dueOn')} <DateText value={cycle.dueDate} /> ·{' '}
          {t('holderIs', { name: cycle.holders.map((holder) => memberName(jameya, holder.customerId)).join(' · ') })}
        </>
      }
    >
      <div className="space-y-4">
        <CycleFigures cycle={cycle} />
        {isActive && (
          <div className="flex flex-wrap gap-2">
            <RecordJameyaPaymentDialog
              jameya={jameya}
              trigger={
                <Button>
                  <Receipt className="size-4" />
                  {t('recordPayment')}
                </Button>
              }
            />
            {canManageJameyas && canHandOver(jameya, cycle) && <PayoutButton cycle={cycle} onHandOver={onHandOver} />}
          </div>
        )}
      </div>
    </Section>
  );
}
