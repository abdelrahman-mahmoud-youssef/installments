'use client';

import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Money } from '@/components/shared/money';
import { NumberInput } from '@/components/shared/number-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney, toMinorUnits } from '@/lib/format';
import {
  amountLeftToSplit,
  canAddPartner,
  isCustomSplit,
  JameyaTurnSplit,
  WizardMember,
  WizardTurn,
} from '@/lib/jameya-wizard';
import { cn } from '@/lib/utils';

const SPLITS: JameyaTurnSplit[] = ['equal', 'custom'];

interface JameyaTurnOrderRowProps {
  turn: WizardTurn;
  index: number;
  turnCount: number;
  shareAmount: number;
  customers: WizardMember[];
  previewContributionOf: (customerId: string) => number | undefined;
  onMove: (to: number) => void;
  onAddPartner: (member: WizardMember) => void;
  onRemovePartner: (customerId: string) => void;
  onSplit: (split: JameyaTurnSplit) => void;
  onAmount: (customerId: string, amount: number | undefined) => void;
}

function SplitBalance({ turn, shareAmount }: { turn: WizardTurn; shareAmount: number }) {
  const t = useTranslations('jameyas.new');
  const locale = useLocale();
  const left = amountLeftToSplit(turn, shareAmount);
  const money = (pounds: number) => formatMoney(toMinorUnits(Math.abs(pounds)), locale, { hideWholeDecimals: true });
  if (left === 0) {
    return <p className="text-xs font-medium text-success">{t('splitDone')}</p>;
  }
  return (
    <p className="text-xs font-medium text-danger">
      {left > 0 ? t('leftToSplit', { amount: money(left) }) : t('overSplit', { amount: money(left) })}
    </p>
  );
}

export function JameyaTurnOrderRow({
  turn,
  index,
  turnCount,
  shareAmount,
  customers,
  previewContributionOf,
  onMove,
  onAddPartner,
  onRemovePartner,
  onSplit,
  onAmount,
}: JameyaTurnOrderRowProps) {
  const t = useTranslations('jameyas.new');
  const isShared = turn.holders.length > 1;
  const isCustom = isCustomSplit(turn);
  const partnerChoices = customers.filter((customer) => canAddPartner(turn, customer.id));
  const partnerItems = Object.fromEntries(partnerChoices.map((customer) => [customer.id, customer.name]));

  return (
    <li className="space-y-2 px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-xs text-muted-foreground">
          {t('turnNumber', { sequence: index + 1 })}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {turn.holders.map((holder) => (
            <span
              key={holder.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium"
            >
              <span className="truncate">{holder.name}</span>
              {isShared && (
                <button
                  type="button"
                  aria-label={t('removePartner', { name: holder.name })}
                  title={t('removePartner', { name: holder.name })}
                  onClick={() => onRemovePartner(holder.id)}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          ))}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={index === 0}
          aria-label={t('moveUp', { name: turn.holders[0].name })}
          onClick={() => onMove(index - 1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={index === turnCount - 1}
          aria-label={t('moveDown', { name: turn.holders[0].name })}
          onClick={() => onMove(index + 1)}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>

      <div className="space-y-2 ps-19">
        {partnerChoices.length > 0 && (
          <Select
            value=""
            onValueChange={(value) => {
              const customer = partnerChoices.find((item) => item.id === value);
              if (customer) {
                onAddPartner(customer);
              }
            }}
            items={partnerItems}
          >
            <SelectTrigger size="sm" className="w-full sm:w-64" aria-label={t('addPartnerTo', { sequence: index + 1 })}>
              <SelectValue placeholder={t('addPartner')} />
            </SelectTrigger>
            <SelectContent>
              {partnerChoices.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} — {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isShared && (
          <div className="space-y-2 rounded-lg border border-border p-2.5">
            <div className="inline-flex rounded-md bg-muted p-0.5" role="group">
              {SPLITS.map((split) => (
                <button
                  key={split}
                  type="button"
                  aria-pressed={turn.split === split}
                  onClick={() => onSplit(split)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium text-muted-foreground',
                    turn.split === split && 'bg-background text-foreground shadow-sm',
                  )}
                >
                  {t(`split.${split}`)}
                </button>
              ))}
            </div>
            <ul className="space-y-1.5">
              {turn.holders.map((holder) => {
                const previewContribution = previewContributionOf(holder.id);
                return (
                  <li key={holder.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{holder.name}</span>
                    {isCustom ? (
                      <NumberInput
                        step="1"
                        min="0"
                        className="h-8 w-28"
                        aria-label={t('partAmount', { name: holder.name })}
                        value={holder.amount}
                        onChange={(amount) => onAmount(holder.id, amount)}
                      />
                    ) : previewContribution === undefined ? (
                      <span className="text-xs text-muted-foreground">{t('splitPending')}</span>
                    ) : (
                      <Money minorUnits={previewContribution} hideWholeDecimals className="font-medium" />
                    )}
                  </li>
                );
              })}
            </ul>
            {isCustom && <SplitBalance turn={turn} shareAmount={shareAmount} />}
          </div>
        )}
      </div>
    </li>
  );
}
