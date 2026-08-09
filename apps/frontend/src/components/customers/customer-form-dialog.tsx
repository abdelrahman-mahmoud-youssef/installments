'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
import { ImagePreviewDialog } from '@/components/shared/image-preview-dialog';
import { ApiError } from '@/lib/api/client';
import { Customer } from '@/lib/api/customers';
import { resolveAssetUrl } from '@/lib/assets';
import { CustomerInput, customerSchema } from '@/lib/schemas/customer';

function ImageUploadSlot({
  form,
  name,
  label,
  existingUrl,
  pickedName,
  onPickedNameChange,
}: {
  form: UseFormReturn<CustomerInput>;
  name: 'photo' | 'idImageFront' | 'idImageBack';
  label: string;
  existingUrl: string | null | undefined;
  pickedName: string | null;
  onPickedNameChange: (name: string | null) => void;
}) {
  const t = useTranslations('customers.form');

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {existingUrl && !pickedName && (
            <ImagePreviewDialog
              src={resolveAssetUrl(existingUrl) ?? ''}
              alt={label}
              trigger={
                <button type="button" className="block">
                  <img
                    src={resolveAssetUrl(existingUrl) ?? undefined}
                    alt={label}
                    className="h-20 rounded-lg border border-border object-cover"
                  />
                </button>
              }
            />
          )}
          <FormControl>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
              <Upload className="size-4 shrink-0" />
              <span className="truncate">{t('uploadImage')}</span>
              <input
                {...field}
                type="file"
                accept="image/*"
                className="hidden"
                value={undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onChange(file ?? undefined);
                  onPickedNameChange(file?.name ?? null);
                }}
              />
            </label>
          </FormControl>
          {pickedName && <p className="truncate text-xs text-muted-foreground">{pickedName}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

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
              existingUrl={customer?.photoUrl}
              pickedName={photoName}
              onPickedNameChange={setPhotoName}
            />
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadSlot
                form={form}
                name="idImageFront"
                label={t('idImageFront')}
                existingUrl={customer?.idImageFrontUrl}
                pickedName={idImageFrontName}
                onPickedNameChange={setIdImageFrontName}
              />
              <ImageUploadSlot
                form={form}
                name="idImageBack"
                label={t('idImageBack')}
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
