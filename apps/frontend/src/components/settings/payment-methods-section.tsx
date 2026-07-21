'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { Section } from '@/components/shared/section';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from '@/hooks/use-payment-methods';
import { ApiError } from '@/lib/api/client';
import { PaymentMethod } from '@/lib/api/payment-methods';
import { PAYMENT_METHOD_PRESETS } from '@/lib/payment-method-presets';
import { PaymentMethodInput, paymentMethodSchema } from '@/lib/schemas/payment-method';

function AddPaymentMethodDialog({
  trigger,
  defaultLabel,
  presetKey,
}: {
  trigger: React.ReactElement;
  defaultLabel: string;
  presetKey?: string;
}) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const createPaymentMethod = useCreatePaymentMethod();

  const form = useForm<PaymentMethodInput>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { label: defaultLabel, details: '', presetKey },
  });

  async function handleSubmit(values: PaymentMethodInput) {
    try {
      await createPaymentMethod.mutateAsync(values);
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
          form.reset({ label: defaultLabel, details: '', presetKey });
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addPaymentMethodTitle')}</DialogTitle>
          <DialogDescription>{t('addPaymentMethodDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
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
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {t('addPaymentMethod')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentMethodPresetPicker({ existingPresetKeys }: { existingPresetKeys: Set<string> }) {
  const t = useTranslations('settings');
  const availablePresets = PAYMENT_METHOD_PRESETS.filter((preset) => !existingPresetKeys.has(preset.key));

  if (availablePresets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('paymentMethodPresetsLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {availablePresets.map((preset) => (
          <AddPaymentMethodDialog
            key={preset.key}
            presetKey={preset.key}
            defaultLabel={preset.label}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border py-1 ps-1.5 pe-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <PaymentMethodIcon presetKey={preset.key} className="size-6" />
                {preset.label}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

function PaymentMethodRow({ method }: { method: PaymentMethod }) {
  const t = useTranslations('settings');
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  async function handleToggleActive(next: boolean) {
    try {
      await updatePaymentMethod.mutateAsync({ id: method.id, input: { isActive: next } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleDelete() {
    try {
      await deletePaymentMethod.mutateAsync(method.id);
      toast.success(t('paymentMethodDeleted'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <PaymentMethodIcon presetKey={method.presetKey} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{method.label}</p>
          <p dir="ltr" className="truncate text-left text-xs text-muted-foreground">
            {method.details}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Switch
          checked={method.isActive}
          onCheckedChange={handleToggleActive}
          disabled={updatePaymentMethod.isPending}
          aria-label={t('paymentMethodActive')}
        />
        <ConfirmDialog
          trigger={
            <Button type="button" variant="ghost" size="icon-sm">
              <Trash2 className="size-4" />
            </Button>
          }
          title={t('deletePaymentMethodTitle')}
          description={t('deletePaymentMethodDescription', { label: method.label })}
          confirmLabel={t('delete')}
          destructive
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}

export function PaymentMethodsSection() {
  const t = useTranslations('settings');
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const existingPresetKeys = new Set(
    (paymentMethods ?? []).map((method) => method.presetKey).filter((key): key is string => Boolean(key)),
  );

  return (
    <Section
      title={t('paymentMethodsTitle')}
      description={t('paymentMethodsDescription')}
      action={
        <AddPaymentMethodDialog
          defaultLabel=""
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-4" />
              {t('addCustomPaymentMethod')}
            </Button>
          }
        />
      }
    >
      <div className="space-y-5">
        <PaymentMethodPresetPicker existingPresetKeys={existingPresetKeys} />

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !paymentMethods || paymentMethods.length === 0 ? (
          <EmptyState icon={Wallet} title={t('noPaymentMethods')} compact />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="divide-y divide-border">
              {paymentMethods.map((method) => (
                <PaymentMethodRow key={method.id} method={method} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
