'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { ImageUploadSlot } from '@/components/shared/image-upload-slot';
import { ApiError } from '@/lib/api/client';
import { Customer } from '@/lib/api/customers';
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
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [idImageFrontName, setIdImageFrontName] = useState<string | null>(null);
  const [idImageBackName, setIdImageBackName] = useState<string | null>(null);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    },
  });

  function resetPickedImages() {
    setPhotoName(null);
    setIdImageFrontName(null);
    setIdImageBackName(null);
  }

  async function handleSubmit(values: CustomerInput) {
    try {
      await onSubmit(values);
      toast.success(customer ? t('updated') : t('created'));
      setOpen(false);
      form.reset();
      resetPickedImages();
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
          resetPickedImages();
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
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
            <ImageUploadSlot
              form={form}
              name="photo"
              label={t('photo')}
              uploadLabel={t('uploadImage')}
              existingUrl={customer?.photoUrl}
              pickedName={photoName}
              onPickedNameChange={setPhotoName}
            />
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadSlot
                form={form}
                name="idImageFront"
                label={t('idImageFront')}
                uploadLabel={t('uploadImage')}
                existingUrl={customer?.idImageFrontUrl}
                pickedName={idImageFrontName}
                onPickedNameChange={setIdImageFrontName}
              />
              <ImageUploadSlot
                form={form}
                name="idImageBack"
                label={t('idImageBack')}
                uploadLabel={t('uploadImage')}
                existingUrl={customer?.idImageBackUrl}
                pickedName={idImageBackName}
                onPickedNameChange={setIdImageBackName}
              />
            </div>
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
