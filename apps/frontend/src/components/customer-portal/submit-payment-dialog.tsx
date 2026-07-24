'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Money } from '@/components/shared/money';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ApiError } from '@/lib/api/client';
import { PublicPaymentMethod, submitPaymentClaim } from '@/lib/api/public';
import { PaymentClaimInput, paymentClaimSchema } from '@/lib/schemas/payment-claim';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SubmitPaymentDialog({
  open,
  onOpenChange,
  publicId,
  contractPublicId,
  amount,
  paymentMethods,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicId: string;
  contractPublicId: string;
  amount: number;
  paymentMethods: PublicPaymentMethod[];
  onSubmitted: () => void;
}) {
  const t = useTranslations('publicCustomer');
  const [screenshotName, setScreenshotName] = useState<string | null>(null);

  const form = useForm<PaymentClaimInput>({
    resolver: zodResolver(paymentClaimSchema),
    defaultValues: { paymentMethodId: '' },
  });

  async function handleSubmit(values: PaymentClaimInput) {
    try {
      const screenshot = await readFileAsBase64(values.screenshot);
      await submitPaymentClaim(publicId, contractPublicId, {
        paymentMethodId: values.paymentMethodId,
        screenshot,
      });
      toast.success(t('submitPaymentSuccess'));
      onOpenChange(false);
      form.reset();
      setScreenshotName(null);
      onSubmitted();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('submitPaymentError'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset();
          setScreenshotName(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('submitPaymentTitle')}</DialogTitle>
          <DialogDescription>{t('submitPaymentDescription')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
          <span className="text-muted-foreground">{t('submitPaymentAmount')}</span>
          <Money minorUnits={amount} className="font-semibold" />
        </div>

        {paymentMethods.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('submitPaymentNoMethods')}</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm has-data-checked:border-primary has-data-checked:bg-primary/5"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <PaymentMethodIcon presetKey={method.presetKey} />
                            <span className="min-w-0">
                              <span className="block font-medium">{method.label}</span>
                              <span className="block text-xs text-muted-foreground" dir="ltr">
                                {method.details}
                              </span>
                            </span>
                          </span>
                          <RadioGroupItem value={method.id} />
                        </label>
                      ))}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="screenshot"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                        <Upload className="size-4 shrink-0" />
                        <span className="truncate">{screenshotName ?? t('submitPaymentScreenshot')}</span>
                        <input
                          {...field}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          value={undefined}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            onChange(file);
                            setScreenshotName(file?.name ?? null);
                          }}
                        />
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {form.formState.isSubmitting ? t('submitPaymentSubmitting') : t('submitPaymentSubmit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
