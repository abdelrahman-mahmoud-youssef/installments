'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJameyaPayment } from '@/hooks/use-jameyas';
import { useJameyaValidationMessages } from '@/hooks/use-jameya-validation-messages';
import { ApiError } from '@/lib/api/client';
import { JameyaDetail } from '@/lib/api/jameyas';
import { toMajorUnits, toMinorUnits, todayIso } from '@/lib/format';
import { createJameyaMoneyEntrySchema, JameyaMoneyEntryInput } from '@/lib/schemas/jameya';
import { cn } from '@/lib/utils';

function JameyaPaymentForm({
  jameya,
  defaultCustomerId,
  onRecorded,
}: {
  jameya: JameyaDetail;
  defaultCustomerId?: string;
  onRecorded: () => void;
}) {
  const t = useTranslations('jameyas.paymentDialog');
  const messages = useJameyaValidationMessages();
  const createPayment = useCreateJameyaPayment(jameya.id);
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [remainingByMember] = useState(
    () => new Map(jameya.members.map((member) => [member.customerId, member.remainingAmount])),
  );
  const [schema] = useState(() =>
    createJameyaMoneyEntrySchema(messages, (customerId) => remainingByMember.get(customerId) ?? 0),
  );
  const owingMembers = jameya.members.filter((member) => member.remainingAmount > 0);
  const memberItems = Object.fromEntries(owingMembers.map((member) => [member.customerId, member.name]));

  const form = useForm<JameyaMoneyEntryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: defaultCustomerId ?? owingMembers[0]?.customerId ?? '',
      amount: undefined,
      paidAt: todayIso(),
      note: '',
    },
  });
  const customerId = useWatch({ control: form.control, name: 'customerId' });
  const amount = useWatch({ control: form.control, name: 'amount' });
  const owed = remainingByMember.get(customerId) ?? 0;
  const enteredMinorUnits = typeof amount === 'number' && amount > 0 ? toMinorUnits(amount) : 0;
  const owedAfterPayment = Math.max(owed - enteredMinorUnits, 0);

  async function handleSubmit(values: JameyaMoneyEntryInput) {
    try {
      await createPayment.mutateAsync({
        customerId: values.customerId,
        amount: toMinorUnits(values.amount),
        paidAt: values.paidAt,
        note: values.note || undefined,
        clientRequestId,
      });
      toast.success(t('recorded'));
      onRecorded();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('recordError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('member')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} items={memberItems}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectMember')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {owingMembers.map((member) => (
                      <SelectItem key={member.customerId} value={member.customerId}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">{t('stillOwes')}</span>
            <button
              type="button"
              disabled={owed === 0}
              onClick={() => form.setValue('amount', toMajorUnits(owed), { shouldValidate: true })}
              className="text-sm font-semibold underline-offset-4 hover:underline disabled:no-underline"
            >
              <Money minorUnits={owed} />
            </button>
          </div>

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

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">{t('owesAfterPayment')}</span>
            <Money
              minorUnits={owedAfterPayment}
              className={cn('text-sm font-semibold', owedAfterPayment === 0 && 'text-success')}
            />
          </div>

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
        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
          <Button type="submit" disabled={form.formState.isSubmitting || owingMembers.length === 0}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {form.formState.isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function RecordJameyaPaymentDialog({
  jameya,
  trigger,
  defaultCustomerId,
}: {
  jameya: JameyaDetail;
  trigger: React.ReactElement;
  defaultCustomerId?: string;
}) {
  const t = useTranslations('jameyas.paymentDialog');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: jameya.name })}</DialogDescription>
        </DialogHeader>
        <JameyaPaymentForm jameya={jameya} defaultCustomerId={defaultCustomerId} onRecorded={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
