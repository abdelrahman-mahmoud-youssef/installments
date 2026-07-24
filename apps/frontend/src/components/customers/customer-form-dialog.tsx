'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import { Customer } from '@/lib/api/customers';
import { resolveAssetUrl } from '@/lib/assets';
import { CustomerInput, customerSchema } from '@/lib/schemas/customer';

export function CustomerFormDialog({
  trigger,
  customer,
  onSubmit,
}: {
  trigger: React.ReactElement;
  customer?: Customer;
  onSubmit: (input: CustomerInput) => Promise<unknown>;
}) {
  const t = useTranslations('customers.form');
  const [open, setOpen] = useState(false);
  const [idImageName, setIdImageName] = useState<string | null>(null);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    },
  });

  async function handleSubmit(values: CustomerInput) {
    try {
      await onSubmit(values);
      toast.success(customer ? t('updated') : t('created'));
      setOpen(false);
      form.reset();
      setIdImageName(null);
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
            name: customer?.name ?? '',
            phone: customer?.phone ?? '',
            address: customer?.address ?? '',
            notes: customer?.notes ?? '',
          });
          setIdImageName(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? t('editTitle') : t('newTitle')}</DialogTitle>
          <DialogDescription>{customer ? t('editDescription') : t('newDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('idImage')}</FormLabel>
                  {customer?.idImageUrl && !idImageName && (
                    <a
                      href={resolveAssetUrl(customer.idImageUrl) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={resolveAssetUrl(customer.idImageUrl) ?? undefined}
                        alt={t('idImage')}
                        className="h-20 rounded-lg border border-border object-cover"
                      />
                    </a>
                  )}
                  <FormControl>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                      <Upload className="size-4 shrink-0" />
                      <span className="truncate">{idImageName ?? t('idImageHint')}</span>
                      <input
                        {...field}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        value={undefined}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onChange(file ?? undefined);
                          setIdImageName(file?.name ?? null);
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
                {form.formState.isSubmitting ? t('saving') : customer ? t('saveChanges') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
