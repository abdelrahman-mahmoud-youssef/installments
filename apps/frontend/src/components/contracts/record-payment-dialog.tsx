'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { Installment } from '@/lib/api/contracts';
import { toMinorUnits } from '@/lib/format';
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

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, note: '' },
  });

  const manualTotal = Object.values(manualAmounts).reduce((total, value) => total + (Number(value) || 0), 0);

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
      form.reset({ amount: 0, note: '' });
      setManualAmounts({});
      setIsManual(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('recordError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('amount')}</FormLabel>
                  <FormControl>
                    <NumberInput step="0.01" min="0" {...field} />
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isManual}
                onChange={(event) => setIsManual(event.target.checked)}
                className="size-4"
              />
              {t('manualToggle')}
            </label>

            {isManual && (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                {outstandingInstallments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noOutstanding')}</p>
                ) : (
                  outstandingInstallments.map((installment) => {
                    const remaining = installment.amount - installment.paidAmount;
                    return (
                      <div key={installment.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>
                          #{installment.sequence} — <Money minorUnits={remaining} />
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
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
                  })
                )}
                <p className="text-xs text-muted-foreground">
                  {t('allocated')} <Money minorUnits={toMinorUnits(manualTotal)} /> {t('allocatedHint')}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
