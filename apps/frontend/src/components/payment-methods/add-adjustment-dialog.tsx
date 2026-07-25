'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
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
import { useCreateCounterpartyAdjustment } from '@/hooks/use-counterparties';
import { ApiError } from '@/lib/api/client';
import { todayIso } from '@/lib/format';
import { CounterpartyAdjustmentInput, counterpartyAdjustmentSchema } from '@/lib/schemas/counterparty';

const DEFAULT_VALUES: CounterpartyAdjustmentInput = {
  direction: 'OUT',
  amount: undefined as unknown as number,
  occurredAt: '',
  note: '',
};

export function AddAdjustmentDialog({ counterpartyId, trigger }: { counterpartyId: string; trigger: React.ReactElement }) {
  const t = useTranslations('contacts.detail');
  const [open, setOpen] = useState(false);
  const createAdjustment = useCreateCounterpartyAdjustment(counterpartyId);

  const form = useForm<CounterpartyAdjustmentInput>({
    resolver: zodResolver(counterpartyAdjustmentSchema),
    defaultValues: { ...DEFAULT_VALUES, occurredAt: todayIso() },
  });

  async function handleSubmit(values: CounterpartyAdjustmentInput) {
    try {
      await createAdjustment.mutateAsync(values);
      toast.success(t('adjustmentSaved'));
      setOpen(false);
      form.reset({ ...DEFAULT_VALUES, occurredAt: todayIso() });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) form.reset({ ...DEFAULT_VALUES, occurredAt: todayIso() });
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('adjustmentDialogTitle')}</DialogTitle>
          <DialogDescription>{t('adjustmentDialogDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                      <label className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary">
                        <RadioGroupItem value="OUT" className="absolute inset-0 size-full rounded-lg border-none opacity-0" />
                        <TrendingUp className="size-4" />
                        {t('adjustmentDirectionIncrease')}
                      </label>
                      <label className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary">
                        <RadioGroupItem value="IN" className="absolute inset-0 size-full rounded-lg border-none opacity-0" />
                        <TrendingDown className="size-4" />
                        {t('adjustmentDirectionDecrease')}
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
                    <FormLabel>{t('adjustmentAmount')}</FormLabel>
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
                    <FormLabel>{t('adjustmentDate')}</FormLabel>
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
                  <FormLabel>{t('adjustmentNote')}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
