'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
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
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useUpdateStaffWalletAccess } from '@/hooks/use-staff';
import { ApiError } from '@/lib/api/client';
import { StaffMember } from '@/lib/api/staff';
import { StaffWalletAccessInput, staffWalletAccessSchema } from '@/lib/schemas/staff';
import { StaffWalletChecklist } from './staff-wallet-checklist';

const SCOPE_OPTION_CLASS_NAME =
  'relative flex cursor-pointer items-center justify-center rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary';

function toFormValues(member: StaffMember): StaffWalletAccessInput {
  return { walletAccess: member.walletAccess, paymentMethodIds: member.paymentMethodIds };
}

export function StaffWalletAccessDialog({ member }: { member: StaffMember }) {
  const t = useTranslations('staff');
  const [open, setOpen] = useState(false);
  const updateWalletAccess = useUpdateStaffWalletAccess();

  const form = useForm<StaffWalletAccessInput>({
    resolver: zodResolver(staffWalletAccessSchema),
    defaultValues: toFormValues(member),
  });
  const walletAccess = useWatch({ control: form.control, name: 'walletAccess' });

  async function handleSubmit(values: StaffWalletAccessInput) {
    try {
      await updateWalletAccess.mutateAsync({ id: member.id, input: values });
      toast.success(t('walletAccessUpdated'));
      setOpen(false);
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
          form.reset(toFormValues(member));
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" aria-label={t('walletAccess')}>
            <Wallet className="size-4" />
            <span className="hidden sm:inline">{t('walletAccess')}</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('walletAccessTitle', { name: member.name })}</DialogTitle>
          <DialogDescription>{t('walletAccessDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="walletAccess"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    <FormLabel>{t('canSeeWallets')}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value !== 'NONE'}
                        onCheckedChange={(isChecked) => field.onChange(isChecked ? 'ALL' : 'NONE')}
                      />
                    </FormControl>
                  </div>
                  {field.value !== 'NONE' && (
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                      <label className={SCOPE_OPTION_CLASS_NAME}>
                        <RadioGroupItem value="ALL" className="absolute inset-0 size-full rounded-lg border-none opacity-0" />
                        {t('allWallets')}
                      </label>
                      <label className={SCOPE_OPTION_CLASS_NAME}>
                        <RadioGroupItem
                          value="SELECTED"
                          className="absolute inset-0 size-full rounded-lg border-none opacity-0"
                        />
                        {t('selectedWallets')}
                      </label>
                    </RadioGroup>
                  )}
                </FormItem>
              )}
            />
            {walletAccess === 'SELECTED' && (
              <FormField
                control={form.control}
                name="paymentMethodIds"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('chooseWallets')}</FormLabel>
                    <StaffWalletChecklist selectedIds={field.value} onChange={field.onChange} />
                    {fieldState.error && (
                      <p role="alert" className="text-sm font-medium text-destructive">
                        {t('selectAtLeastOneWallet')}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}
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
