'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { Money } from '@/components/shared/money';
import { NumberInput } from '@/components/shared/number-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJameyaPayout } from '@/hooks/use-jameyas';
import { useJameyaValidationMessages } from '@/hooks/use-jameya-validation-messages';
import { ApiError } from '@/lib/api/client';
import { JameyaCycle, JameyaDetail, JameyaPayoutResult } from '@/lib/api/jameyas';
import { formatMoney, toMajorUnits, toMinorUnits, todayIso } from '@/lib/format';
import { availableCashOf, memberNameOf, openHoldersOf, suggestedPayoutOf } from '@/lib/jameya-turns';
import { createJameyaMoneyEntrySchema, JameyaMoneyEntryInput } from '@/lib/schemas/jameya';
import { JameyaReceiptButton } from './jameya-receipt-button';
import { useJameyaReceipts } from './use-jameya-receipts';

function SummaryLine({ label, minorUnits, tone }: { label: string; minorUnits: number; tone?: 'warning' }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Money
        minorUnits={minorUnits}
        hideWholeDecimals
        className={tone === 'warning' ? 'font-semibold text-warning' : 'font-medium'}
      />
    </div>
  );
}

function PayoutResult({
  jameya,
  cycle,
  result,
  holderName,
  onClose,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  result: JameyaPayoutResult;
  holderName: string;
  onClose: () => void;
}) {
  const t = useTranslations('jameyas.payoutDialog');
  const { buildPayoutReceipt } = useJameyaReceipts(jameya);
  const entitlementAmount =
    cycle.holders.find((holder) => holder.customerId === result.customerId)?.entitlementAmount ?? 0;

  return (
    <>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-success">
          <CircleCheck className="size-5" />
          <p className="font-medium">{t('handedOver', { name: holderName })}</p>
        </div>
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3.5">
          <SummaryLine label={t('amount')} minorUnits={result.amount} />
          <SummaryLine
            label={t('shopCovered')}
            minorUnits={result.coveredAmount}
            tone={result.coveredAmount > 0 ? 'warning' : undefined}
          />
          <SummaryLine label={t('stillOwedForTurn')} minorUnits={result.remainingAmount} />
        </div>
      </div>
      <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
        <JameyaReceiptButton
          variant="full"
          fileName={`${jameya.name} ${holderName}`}
          buildContent={() =>
            buildPayoutReceipt({
              holderName,
              cycle,
              payout: result,
              entitlementAmount,
              remainingAmount: result.remainingAmount,
            })
          }
        />
        <Button type="button" onClick={onClose}>
          {t('done')}
        </Button>
      </DialogFooter>
    </>
  );
}

function HolderChoice({
  jameya,
  cycle,
  value,
  onChange,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  value: string;
  onChange: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas.payoutDialog');
  const locale = useLocale();
  const money = (minorUnits: number) => formatMoney(minorUnits, locale, { hideWholeDecimals: true });

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{t('chooseHolder')}</p>
      <RadioGroup value={value} onValueChange={(next) => onChange(String(next))} className="gap-2">
        {openHoldersOf(cycle).map((holder) => (
          <label
            key={holder.customerId}
            className="relative flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
          >
            <RadioGroupItem
              value={holder.customerId}
              className="absolute inset-0 size-full rounded-lg border-none opacity-0"
            />
            <span className="truncate font-medium">{memberNameOf(jameya, holder.customerId)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {t('holderPart', { part: money(holder.entitlementAmount), remaining: money(holder.remainingAmount) })}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function JameyaPayoutForm({
  jameya,
  cycle,
  holderId,
  onClose,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  holderId: string | null;
  onClose: () => void;
}) {
  const t = useTranslations('jameyas.payoutDialog');
  const locale = useLocale();
  const messages = useJameyaValidationMessages();
  const createPayout = useCreateJameyaPayout(jameya.id);
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<JameyaPayoutResult | null>(null);
  const [remainingByHolder] = useState(
    () => new Map(cycle.holders.map((holder) => [holder.customerId, holder.remainingAmount])),
  );
  const [schema] = useState(() =>
    createJameyaMoneyEntrySchema(messages, (customerId) => remainingByHolder.get(customerId) ?? 0),
  );
  const openHolders = openHoldersOf(cycle);
  const availableCash = availableCashOf(cycle);
  const amountFor = (customerId: string) => {
    const suggested = suggestedPayoutOf(cycle, customerId);
    return suggested > 0 ? toMajorUnits(suggested) : undefined;
  };
  const initialHolderId =
    openHolders.find((holder) => holder.customerId === holderId)?.customerId ?? openHolders[0]?.customerId ?? '';

  const form = useForm<JameyaMoneyEntryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: initialHolderId,
      amount: amountFor(initialHolderId),
      paidAt: todayIso(),
      note: '',
    },
  });
  const customerId = useWatch({ control: form.control, name: 'customerId' });
  const amount = useWatch({ control: form.control, name: 'amount' });
  const enteredMinorUnits = typeof amount === 'number' && amount > 0 ? toMinorUnits(amount) : 0;
  const fromShopMoney = Math.max(0, enteredMinorUnits - availableCash);
  const remainingAfterPayout = Math.max(0, (remainingByHolder.get(customerId) ?? 0) - enteredMinorUnits);

  if (result) {
    return (
      <PayoutResult
        jameya={jameya}
        cycle={cycle}
        result={result}
        holderName={memberNameOf(jameya, result.customerId)}
        onClose={onClose}
      />
    );
  }

  async function handleSubmit(values: JameyaMoneyEntryInput) {
    try {
      const payout = await createPayout.mutateAsync({
        cycleId: cycle.id,
        payload: {
          customerId: values.customerId,
          amount: toMinorUnits(values.amount),
          paidAt: values.paidAt,
          note: values.note || undefined,
          clientRequestId,
        },
      });
      setResult(payout);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('payoutError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {openHolders.length > 1 ? (
            <HolderChoice
              jameya={jameya}
              cycle={cycle}
              value={customerId}
              onChange={(nextHolderId) => {
                form.setValue('customerId', nextHolderId);
                form.setValue('amount', amountFor(nextHolderId) as number);
                form.clearErrors('amount');
              }}
            />
          ) : (
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">{t('holder')}</p>
              <p className="font-heading text-lg font-semibold">{memberNameOf(jameya, customerId)}</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('amount')}</FormLabel>
                <FormControl>
                  <NumberInput step="1" min="0" {...field} />
                </FormControl>
                {remainingAfterPayout > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('remainingAfter', {
                      amount: formatMoney(remainingAfterPayout, locale, { hideWholeDecimals: true }),
                    })}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {fromShopMoney > 0 && (
            <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm text-warning">
              {t('fromShopMoneyPrefix')} <Money minorUnits={fromShopMoney} hideWholeDecimals className="font-semibold" />{' '}
              {t('fromShopMoneySuffix')}
            </p>
          )}

          <FormField
            control={form.control}
            name="paidAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('paidAt')}</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    max={todayIso()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('note')}</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder={t('notePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
          <Button type="submit" disabled={form.formState.isSubmitting || openHolders.length === 0}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {form.formState.isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function JameyaPayoutDialog({
  jameya,
  cycle,
  holderId,
  open,
  onOpenChange,
}: {
  jameya: JameyaDetail;
  cycle: JameyaCycle | null;
  holderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('jameyas.payoutDialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {cycle && (
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border p-5">
            <DialogTitle>{t('title', { sequence: cycle.sequence })}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <JameyaPayoutForm
            key={`${cycle.id}-${holderId}`}
            jameya={jameya}
            cycle={cycle}
            holderId={holderId}
            onClose={() => onOpenChange(false)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
