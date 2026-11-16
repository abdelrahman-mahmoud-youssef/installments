'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { useCreatePaymentMethod, useUpdatePaymentMethod } from '@/hooks/use-payment-methods';
import { ApiError } from '@/lib/api/client';
import { PaymentMethod } from '@/lib/api/payment-methods';
import { getPaymentMethodPreset, PAYMENT_METHOD_ICON_OPTIONS } from '@/lib/payment-method-presets';
import { PaymentMethodInput, paymentMethodSchema } from '@/lib/schemas/payment-method';
import { cn } from '@/lib/utils';

export function PaymentMethodFormDialog({
  trigger,
  method,
  defaultLabel,
  presetKey,
}: {
  trigger: React.ReactElement;
  method?: PaymentMethod;
  defaultLabel: string;
  presetKey?: string;
}) {
  const t = useTranslations('paymentMethods');
  const [open, setOpen] = useState(false);
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();

  const defaultMonthlyLimit = method
    ? (method.monthlyLimit ?? undefined)
    : presetKey
      ? getPaymentMethodPreset(presetKey).suggestedMonthlyLimit
      : undefined;

  const form = useForm<PaymentMethodInput>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      label: method?.label ?? defaultLabel,
      details: method?.details ?? '',
      presetKey,
      monthlyLimit: defaultMonthlyLimit,
    },
  });

  async function handleSubmit(values: PaymentMethodInput) {
    try {
      if (method) {
        await updatePaymentMethod.mutateAsync({
          id: method.id,
          input: { label: values.label, details: values.details, monthlyLimit: values.monthlyLimit ?? null },
        });
      } else {
        await createPaymentMethod.mutateAsync(values);
      }
      toast.success(t('paymentMethodSaved'));
      setOpen(false);
      form.reset();
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
          form.reset({
            label: method?.label ?? defaultLabel,
            details: method?.details ?? '',
            presetKey,
            monthlyLimit: defaultMonthlyLimit,
          });
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{method ? t('editPaymentMethodTitle') : t('addPaymentMethodTitle')}</DialogTitle>
          <DialogDescription>
            {method ? t('editPaymentMethodDescription') : t('addPaymentMethodDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            {!method && !presetKey ? (
              <FormField
                control={form.control}
                name="iconKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('paymentMethodIconOptional')}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHOD_ICON_OPTIONS.map(({ key, icon: Icon }) => {
                        const isSelected = field.value === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={t(`paymentMethodIcons.${key}`)}
                            onClick={() => field.onChange(isSelected ? undefined : key)}
                            className={cn(
                              'grid size-10 place-items-center rounded-lg border transition-colors',
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-accent',
                            )}
                          >
                            <Icon className="size-5" />
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethodLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('paymentMethodLabelPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethodDetails')}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder={t('paymentMethodDetailsPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentMethodMonthlyLimit')}</FormLabel>
                  <FormControl>
                    <NumberInput step="1" min="0" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('paymentMethodMonthlyLimitHint')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {method ? t('paymentMethodSaveChanges') : t('addPaymentMethod')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
