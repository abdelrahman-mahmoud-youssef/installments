'use client';

import { HandCoins } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { JameyaCycle, JameyaDetail } from '@/lib/api/jameyas';
import { formatDate, formatMoney } from '@/lib/format';
import { canHandOverTurn, findCurrentTurn } from '@/lib/jameya-turns';
import { JameyaTurnHolders } from './jameya-turn-holders';
import { useTurnHoldersLabel } from './use-turn-holders-label';

const FULL_PERCENT = 100;

export function JameyaCurrentTurnCard({
  jameya,
  onHandOver,
}: {
  jameya: JameyaDetail;
  onHandOver: (cycle: JameyaCycle, customerId: string) => void;
}) {
  const t = useTranslations('jameyas.detail');
  const locale = useLocale();
  const { canManageJameyas } = useJameyaAccess();
  const money = (minorUnits: number) => formatMoney(minorUnits, locale, { hideWholeDecimals: true });
  const holdersLabel = useTurnHoldersLabel(jameya);
  const cycle = findCurrentTurn(jameya);

  if (!cycle) {
    return (
      <Section title={t(`currentTitle.${jameya.recurrenceType}`)}>
        <p className="text-sm text-muted-foreground">{t('allHandedOver')}</p>
      </Section>
    );
  }

  const holderName = holdersLabel(cycle);
  const [onlyHolder] = cycle.holders;
  const isShared = cycle.holders.length > 1;
  const missingAmount = Math.max(0, cycle.potAmount - cycle.collectedAmount);
  const collectedPercent = Math.min(FULL_PERCENT, (cycle.collectedAmount / cycle.potAmount) * FULL_PERCENT);

  return (
    <Section title={t(`currentTitle.${jameya.recurrenceType}`)}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {t('turnOn', { sequence: cycle.sequence, date: formatDate(cycle.dueDate) })}
          </p>
          <p className="font-heading text-xl font-semibold sm:text-2xl">
            {t(isShared ? 'sharedTurnGets' : 'holderGets', { name: holderName, amount: money(cycle.potAmount) })}
          </p>
        </div>

        {isShared && <JameyaTurnHolders jameya={jameya} cycle={cycle} onHandOver={onHandOver} />}

        <div className="space-y-1.5">
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={cycle.potAmount}
            aria-valuenow={cycle.collectedAmount}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${collectedPercent}%` }} />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{t('collectedAmount', { amount: money(cycle.collectedAmount) })}</span>
            {missingAmount > 0 && (
              <span className="text-muted-foreground">{t('missingAmount', { amount: money(missingAmount) })}</span>
            )}
          </div>
        </div>

        {cycle.exposureAmount > 0 && (
          <p className="text-sm text-muted-foreground">{t('shopPaid', { amount: money(cycle.exposureAmount) })}</p>
        )}

        {!isShared && canManageJameyas && canHandOverTurn(jameya, cycle) && (
          <Button variant="outline" onClick={() => onHandOver(cycle, onlyHolder.customerId)}>
            <HandCoins className="size-4" />
            {t('handOverTo', { name: holderName })}
          </Button>
        )}
      </div>
    </Section>
  );
}
