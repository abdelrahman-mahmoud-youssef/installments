'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useJameyaValidationMessages } from '@/hooks/use-jameya-validation-messages';
import { useCreateJameyaPayment } from '@/hooks/use-jameyas';
import { ApiError } from '@/lib/api/client';
import { JameyaDetail, JameyaMember } from '@/lib/api/jameyas';
import { toMajorUnits, toMinorUnits, todayIso } from '@/lib/format';
import { suggestedPaymentOf } from '@/lib/jameya-turns';
import { createJameyaCollectSchema, JameyaCollectInput } from '@/lib/schemas/jameya';

function CollectForm({ jameya, member, onDone }: { jameya: JameyaDetail; member: JameyaMember; onDone: () => void }) {
  const t = useTranslations('jameyas');
  const messages = useJameyaValidationMessages();
  const createPayment = useCreateJameyaPayment(jameya.id);
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [imageName, setImageName] = useState<string | null>(null);
  const [schema] = useState(() => createJameyaCollectSchema(messages, () => member.remainingAmount));
  const suggested = suggestedPaymentOf(jameya, member.customerId);

  const form = useForm<JameyaCollectInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: member.customerId,
      amount: suggested > 0 ? toMajorUnits(suggested) : undefined,
      paidAt: todayIso(),
      note: '',
      image: undefined,
    },
  });

  async function handleSubmit(values: JameyaCollectInput) {
    try {
      await createPayment.mutateAsync({
        customerId: values.customerId,
        amount: toMinorUnits(values.amount),
        paidAt: values.paidAt,
        note: values.note || undefined,
        image: values.image,
        clientRequestId,
      });
      toast.success(t('paymentDialog.recorded'));
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('paymentDialog.recordError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentDialog.amount')}</FormLabel>
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
              <FormLabel>{t('paymentDialog.note')}</FormLabel>
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
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>{t('detail.receipt')}</FormLabel>
              <FormControl>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                  <Upload className="size-4 shrink-0" />
                  <span className="truncate">{imageName ?? t('detail.receiptHint')}</span>
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
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {form.formState.isSubmitting ? t('paymentDialog.submitting') : t('detail.recordShort')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function JameyaCollectDialog({ jameya, member }: { jameya: JameyaDetail; member: JameyaMember }) {
  const t = useTranslations('jameyas');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            {t('detail.recordShort')}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('detail.collectTitle', { name: member.name })}</DialogTitle>
          <DialogDescription>{t('paymentDialog.description', { name: member.name })}</DialogDescription>
        </DialogHeader>
        {open && <CollectForm jameya={jameya} member={member} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
