'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { NumberInput } from '@/components/shared/number-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePaymentMethodTransaction, usePaymentMethodTransactions } from '@/hooks/use-payment-method-transactions';
import { ApiError } from '@/lib/api/client';
import { PaymentMethod } from '@/lib/api/payment-methods';
import { todayIso } from '@/lib/format';
import { PaymentMethodTransactionInput, paymentMethodTransactionSchema } from '@/lib/schemas/payment-method-transaction';

function TransactionForm({ paymentMethodId }: { paymentMethodId: string }) {
  const t = useTranslations('settings');
  const createTransaction = useCreatePaymentMethodTransaction(paymentMethodId);

  const form = useForm<PaymentMethodTransactionInput>({
    resolver: zodResolver(paymentMethodTransactionSchema),
    defaultValues: { direction: 'OUT', amount: undefined, occurredAt: todayIso(), note: '' },
  });

  async function handleSubmit(values: PaymentMethodTransactionInput) {
    try {
      await createTransaction.mutateAsync(values);
      toast.success(t('transactionLogged'));
      form.reset({ direction: 'OUT', amount: undefined, occurredAt: todayIso(), note: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 rounded-lg border border-border p-3.5">
        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-sm has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                    <RadioGroupItem value="OUT" className="sr-only" />
                    <ArrowUpRight className="size-3.5" />
                    {t('transactionDirectionOut')}
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-sm has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                    <RadioGroupItem value="IN" className="sr-only" />
                    <ArrowDownLeft className="size-3.5" />
                    {t('transactionDirectionIn')}
                  </label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
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
        <Button type="submit" size="sm" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t('logTransaction')}
        </Button>
      </form>
    </Form>
  );
}

function TransactionHistory({ paymentMethodId }: { paymentMethodId: string }) {
  const t = useTranslations('settings');
  const { data, isLoading } = usePaymentMethodTransactions(paymentMethodId, { limit: 20 });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState icon={ArrowUpRight} title={t('noTransactionsYet')} compact />;
  }

  return (
    <div className="max-h-52 space-y-1 overflow-y-auto">
      {data.data.map((transaction) => (
        <div key={transaction.id} className="flex items-center gap-3 py-1.5">
          <span
            className={
              transaction.direction === 'OUT'
                ? 'grid size-8 shrink-0 place-items-center rounded-full bg-danger/12 text-danger'
                : 'grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-success'
            }
          >
            {transaction.direction === 'OUT' ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownLeft className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              <DateText value={transaction.occurredAt} />
            </p>
            {transaction.note && <p className="truncate text-xs text-muted-foreground">{transaction.note}</p>}
          </div>
          <Money minorUnits={transaction.amount} className="text-sm font-semibold" />
        </div>
      ))}
    </div>
  );
}

export function PaymentMethodUsageDialog({
  method,
  trigger,
}: {
  method: PaymentMethod;
  trigger: React.ReactElement;
}) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('paymentMethodUsageDialogTitle', { label: method.label })}</DialogTitle>
          <DialogDescription>
            <Money minorUnits={method.monthToDateUsage} /> / <Money minorUnits={method.monthlyLimit ?? 0} />
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <TransactionForm paymentMethodId={method.id} />
          <TransactionHistory paymentMethodId={method.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
