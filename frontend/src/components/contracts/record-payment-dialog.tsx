'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
      toast.success('Payment recorded.');
      setOpen(false);
      form.reset({ amount: 0, note: '' });
      setManualAmounts({});
      setIsManual(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not record payment.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            By default, payments apply to the oldest unpaid installment first, with any excess rolling into
            the next one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
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
                  <FormLabel>Note (optional)</FormLabel>
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
              Manually select which installments receive this payment
            </label>

            {isManual && (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                {outstandingInstallments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outstanding installments.</p>
                ) : (
                  outstandingInstallments.map((installment) => {
                    const remaining = installment.amount - installment.paidAmount;
                    return (
                      <div key={installment.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>
                          #{installment.sequence} — remaining <Money minorUnits={remaining} />
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
                  Allocated: <Money minorUnits={toMinorUnits(manualTotal)} /> — must equal the payment amount.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording…' : 'Record payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
