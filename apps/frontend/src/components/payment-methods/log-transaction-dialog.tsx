'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePaymentMethodTransaction } from '@/hooks/use-payment-method-transactions';
import { ApiError } from '@/lib/api/client';
import { todayIso } from '@/lib/format';
import { PaymentMethodTransactionInput, paymentMethodTransactionSchema } from '@/lib/schemas/payment-method-transaction';

const DEFAULT_VALUES: PaymentMethodTransactionInput = {
  direction: 'OUT',
  amount: undefined as unknown as number,
  occurredAt: '',
  counterpartyName: '',
  counterpartyPhone: '',
  note: '',
};

export function LogTransactionDialog({
  paymentMethodId,
  trigger,
}: {
  paymentMethodId: string;
  trigger: React.ReactElement;
}) {
  const t = useTranslations('paymentMethods');
  const [open, setOpen] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const createTransaction = useCreatePaymentMethodTransaction(paymentMethodId);

  const form = useForm<PaymentMethodTransactionInput>({
    resolver: zodResolver(paymentMethodTransactionSchema),
    defaultValues: { ...DEFAULT_VALUES, occurredAt: todayIso() },
  });

  const direction = form.watch('direction');

  async function handleSubmit(values: PaymentMethodTransactionInput) {
    try {
      await createTransaction.mutateAsync(values);
      toast.success(t('transactionLogged'));
      setOpen(false);
      form.reset({ ...DEFAULT_VALUES, occurredAt: todayIso() });
      setImageName(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          form.reset({ ...DEFAULT_VALUES, occurredAt: todayIso() });
          setImageName(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>{t('logTransaction')}</DialogTitle>
          <DialogDescription>{t('logTransactionDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                        <label className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary">
                          <RadioGroupItem value="OUT" className="absolute inset-0 size-full rounded-lg border-none opacity-0" />
                          <ArrowUpCircle className="size-4" />
                          {t('transactionDirectionOut')}
                        </label>
                        <label className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary">
                          <RadioGroupItem value="IN" className="absolute inset-0 size-full rounded-lg border-none opacity-0" />
                          <ArrowDownCircle className="size-4" />
                          {t('transactionDirectionIn')}
                        </label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('transactionAmount')}</FormLabel>
                      <FormControl>
                        <NumberInput step="1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occurredAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('transactionDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" max={todayIso()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="counterpartyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {direction === 'OUT' ? t('counterpartyNameTo') : t('counterpartyNameFrom')}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="counterpartyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('counterpartyPhone')}</FormLabel>
                      <FormControl>
                        <Input dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transactionNote')}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>{t('transactionReceipt')}</FormLabel>
                    <FormControl>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                        <Upload className="size-4 shrink-0" />
                        <span className="truncate">{imageName ?? t('transactionReceiptHint')}</span>
                        <input
                          {...field}
                          type="file"
                          accept="image/png,image/jpeg"
                          capture="environment"
                          className="hidden"
                          value={undefined}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            onChange(file ?? undefined);
                            setImageName(file?.name ?? null);
                          }}
                        />
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {t('logTransaction')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
