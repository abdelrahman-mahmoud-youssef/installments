'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCounterparties } from '@/hooks/use-counterparties';
import { useCreatePaymentMethodTransaction } from '@/hooks/use-payment-method-transactions';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { ApiError } from '@/lib/api/client';
import { todayIso } from '@/lib/format';
import { PaymentMethodTransactionInput, paymentMethodTransactionSchema } from '@/lib/schemas/payment-method-transaction';

const DEFAULT_VALUES: PaymentMethodTransactionInput = {
  direction: 'OUT',
  amount: undefined as unknown as number,
  occurredAt: '',
  counterpartyId: '',
  counterpartyName: '',
  counterpartyPhone: '',
  note: '',
};

function ContactTypeahead({ form }: { form: UseFormReturn<PaymentMethodTransactionInput> }) {
  const t = useTranslations('paymentMethods');
  const direction = form.watch('direction');
  const name = form.watch('counterpartyName');
  const [isOpen, setIsOpen] = useState(false);
  const { data: contacts } = useCounterparties({ limit: 50 });

  const matches = (contacts?.data ?? []).filter((contact) =>
    name ? contact.name.toLowerCase().includes(name.toLowerCase()) : false,
  );

  return (
    <div className="relative">
      <FormField
        control={form.control}
        name="counterpartyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{direction === 'OUT' ? t('counterpartyNameTo') : t('counterpartyNameFrom')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                onChange={(event) => {
                  field.onChange(event);
                  form.setValue('counterpartyId', '');
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                  field.onBlur();
                  setTimeout(() => setIsOpen(false), 150);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {isOpen && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {matches.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-start text-sm hover:bg-accent"
              onMouseDown={(event) => {
                event.preventDefault();
                form.setValue('counterpartyId', contact.id);
                form.setValue('counterpartyName', contact.name);
                form.setValue('counterpartyPhone', contact.phone ?? '');
                setIsOpen(false);
              }}
            >
              <span className="font-medium">{contact.name}</span>
              {contact.phone && <span className="text-xs text-muted-foreground">{contact.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogTransactionDialog({
  paymentMethodId,
  counterparty,
  trigger,
}: {
  paymentMethodId?: string;
  counterparty?: { id: string; name: string; phone: string | null };
  trigger: React.ReactElement;
}) {
  const t = useTranslations('paymentMethods');
  const [open, setOpen] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const { data: paymentMethods } = usePaymentMethods();
  const createTransaction = useCreatePaymentMethodTransaction();

  const activePaymentMethods = (paymentMethods ?? []).filter((method) => method.isActive);
  const resolvedPaymentMethodId = paymentMethodId ?? selectedPaymentMethodId;

  const contactDefaults: Partial<PaymentMethodTransactionInput> = counterparty
    ? { counterpartyId: counterparty.id, counterpartyName: counterparty.name, counterpartyPhone: counterparty.phone ?? '' }
    : {};

  const form = useForm<PaymentMethodTransactionInput>({
    resolver: zodResolver(paymentMethodTransactionSchema),
    defaultValues: { ...DEFAULT_VALUES, ...contactDefaults, occurredAt: todayIso() },
  });

  async function handleSubmit(values: PaymentMethodTransactionInput) {
    if (!resolvedPaymentMethodId) return;
    try {
      await createTransaction.mutateAsync({ paymentMethodId: resolvedPaymentMethodId, input: values });
      toast.success(t('transactionLogged'));
      setOpen(false);
      form.reset({ ...DEFAULT_VALUES, ...contactDefaults, occurredAt: todayIso() });
      setImageName(null);
      setSelectedPaymentMethodId('');
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
          form.reset({ ...DEFAULT_VALUES, ...contactDefaults, occurredAt: todayIso() });
          setImageName(null);
          setSelectedPaymentMethodId('');
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
              {!paymentMethodId && (
                <div className="flex flex-col gap-2">
                  <Label>{t('paymentMethodPickerLabel')}</Label>
                  <Select value={selectedPaymentMethodId} onValueChange={(value) => setSelectedPaymentMethodId(value ?? '')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('paymentMethodPickerPlaceholder')}>
                        {(value: string | null) =>
                          activePaymentMethods.find((method) => method.id === value)?.label ??
                          t('paymentMethodPickerPlaceholder')
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {activePaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <PaymentMethodIcon presetKey={method.presetKey} className="size-5" />
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
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
                    <FormItem className="min-w-0">
                      <FormLabel>{t('transactionDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" max={todayIso()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {counterparty ? (
                <p className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-sm">
                  <span className="font-medium">{counterparty.name}</span>
                  {counterparty.phone && <span className="text-muted-foreground"> · {counterparty.phone}</span>}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ContactTypeahead form={form} />
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
              )}

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
                          accept="image/*"
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
              <Button type="submit" disabled={form.formState.isSubmitting || !resolvedPaymentMethodId}>
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
