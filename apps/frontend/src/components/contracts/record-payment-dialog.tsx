'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { Money } from '@/components/shared/money';
import { NumberInput } from '@/components/shared/number-input';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { ApiError } from '@/lib/api/client';
import { Installment } from '@/lib/api/contracts';
import { toMinorUnits, toMajorUnits, todayIso } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PaymentInput, paymentSchema } from '@/lib/schemas/payment';

export function RecordPaymentDialog({
  trigger,
  outstandingInstallments,
  onSubmit,
}: {
  trigger: React.ReactElement;
  outstandingInstallments: Installment[];
  onSubmit: (input: PaymentInput) => Promise<unknown>;
}) {
  const t = useTranslations('payments.dialog');
  const [open, setOpen] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const { data: paymentMethods } = usePaymentMethods();
  const activePaymentMethods = (paymentMethods ?? []).filter((method) => method.isActive);

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: undefined, paymentMethodId: '', paidAt: todayIso(), note: '' },
  });

  const nextRemaining = outstandingInstallments[0]
    ? outstandingInstallments[0].amount - outstandingInstallments[0].paidAmount
    : 0;
  const totalOutstanding = outstandingInstallments.reduce(
    (sum, item) => sum + (item.amount - item.paidAmount),
    0,
  );
  const manualTotal = Object.values(manualAmounts).reduce((total, value) => total + (Number(value) || 0), 0);

  const watchedAmount = form.watch('amount');
  const enteredMinorUnits = isManual
    ? toMinorUnits(manualTotal)
    : typeof watchedAmount === 'number' && !Number.isNaN(watchedAmount) && watchedAmount > 0
      ? toMinorUnits(watchedAmount)
      : 0;
  const previewRemaining = Math.max(totalOutstanding - enteredMinorUnits, 0);

  async function handleSubmit(values: PaymentInput) {
    const allocations = isManual
      ? Object.entries(manualAmounts)
          .filter(([, amount]) => Number(amount) > 0)
          .map(([installmentId, amount]) => ({ installmentId, amount: Number(amount) }))
      : undefined;

    try {
      await onSubmit({ ...values, allocations });
      toast.success(t('recorded'));
      setOpen(false);
      form.reset({ amount: undefined, paymentMethodId: '', paidAt: todayIso(), note: '' });
      setManualAmounts({});
      setIsManual(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('recordError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('amount')}</FormLabel>
                    <FormControl>
                      <NumberInput step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {outstandingInstallments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => form.setValue('amount', toMajorUnits(nextRemaining), { shouldValidate: true })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    {t('quickNext')}
                    <Money minorUnits={nextRemaining} className="text-muted-foreground" />
                  </button>
                  {outstandingInstallments.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue('amount', toMajorUnits(totalOutstanding), { shouldValidate: true })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      {t('quickFull')}
                      <Money minorUnits={totalOutstanding} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('paymentMethod')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string | null) =>
                              activePaymentMethods.find((method) => method.id === value)?.label ?? t('cash')
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('cash')}</SelectItem>
                        {activePaymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <PaymentMethodIcon presetKey={method.presetKey} className="size-5" />
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {outstandingInstallments.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">{t('remainingAfterPayment')}</span>
                  <Money
                    minorUnits={previewRemaining}
                    className={cn('text-sm font-semibold', previewRemaining === 0 && 'text-success')}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('note')}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={isManual}
                  onChange={(event) => setIsManual(event.target.checked)}
                  className="size-4 accent-primary"
                />
                {t('manualToggle')}
              </label>

              {isManual && (
                <div className="space-y-2.5 rounded-lg border border-border p-3.5">
                  {outstandingInstallments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noOutstanding')}</p>
                  ) : (
                    <div className="max-h-44 space-y-2.5 overflow-y-auto">
                      {outstandingInstallments.map((installment) => {
                        const remaining = installment.amount - installment.paidAmount;
                        return (
                          <div key={installment.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              #{installment.sequence} · <Money minorUnits={remaining} />
                            </span>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              className="h-8 w-28"
                              value={manualAmounts[installment.id] ?? ''}
                              onChange={(event) =>
                                setManualAmounts((previous) => ({
                                  ...previous,
                                  [installment.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
                    <span>{t('allocated')}</span>
                    <span
                      className={cn(
                        'font-semibold',
                        toMinorUnits(manualTotal) === toMinorUnits(Number(form.watch('amount')) || 0)
                          ? 'text-success'
                          : 'text-foreground',
                      )}
                    >
                      <Money minorUnits={toMinorUnits(manualTotal)} />
                    </span>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
