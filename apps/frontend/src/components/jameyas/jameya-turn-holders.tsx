'use client';

import { HandCoins } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { JameyaCycle, JameyaDetail } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import { canHandOverTurn, memberNameOf } from '@/lib/jameya-turns';

export function JameyaTurnHolders({
  jameya,
  cycle,
  onHandOver,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  onHandOver?: (cycle: JameyaCycle, customerId: string) => void;
}) {
  const t = useTranslations('jameyas.detail');
  const locale = useLocale();
  const { canManageJameyas } = useJameyaAccess();
  const money = (minorUnits: number) => formatMoney(minorUnits, locale, { hideWholeDecimals: true });
  const canHandOver = Boolean(onHandOver) && canManageJameyas && canHandOverTurn(jameya, cycle);

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-background">
      {cycle.holders.map((holder) => {
        const name = memberNameOf(jameya, holder.customerId);
        return (
          <li key={holder.customerId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {t('holder.pays', {
                  amount: money(holder.contribution),
                  period: t(`period.${jameya.recurrenceType}`),
                })}
              </p>
            </div>
            <div className="space-y-0.5 text-end text-xs">
              <p className="font-semibold">{t('holder.part', { amount: money(holder.entitlementAmount) })}</p>
              <p className="text-muted-foreground">
                {t('holder.received', { amount: money(holder.paidOutAmount) })}
                {holder.remainingAmount > 0 && ` · ${t('holder.remaining', { amount: money(holder.remainingAmount) })}`}
              </p>
            </div>
            {canHandOver && holder.remainingAmount > 0 && (
              <Button
                variant="outline"
                size="sm"
                aria-label={t('handOverTo', { name })}
                onClick={() => onHandOver?.(cycle, holder.customerId)}
              >
                <HandCoins className="size-4" />
                {t('handOverPayout')}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
