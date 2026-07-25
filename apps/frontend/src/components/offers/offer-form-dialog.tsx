'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api/client';
import type { Offer } from '@/lib/api/offers';
import { resolveAssetUrl } from '@/lib/assets';
import { MAX_OFFER_IMAGES, OfferInput, offerSchema } from '@/lib/schemas/offer';

function imagePreviewUrl(image: string | File): string {
  return typeof image === 'string' ? (resolveAssetUrl(image) ?? '') : URL.createObjectURL(image);
}

export function OfferFormDialog({
  trigger,
  offer,
  onSubmit,
}: {
  trigger: React.ReactElement;
  offer?: Offer;
  onSubmit: (input: OfferInput) => Promise<unknown>;
}) {
  const t = useTranslations('offers.form');
  const [open, setOpen] = useState(false);

  const defaultValues: OfferInput = {
    title: offer?.title ?? '',
    description: offer?.description ?? '',
    tag: offer?.tag ?? '',
    isActive: offer?.isActive ?? true,
    images: offer?.images ?? [],
  };

  const form = useForm<OfferInput>({
    resolver: zodResolver(offerSchema),
    defaultValues,
  });

  const images = form.watch('images');

  function addImages(files: FileList | null) {
    if (!files) {
      return;
    }
    const next = [...images, ...Array.from(files)].slice(0, MAX_OFFER_IMAGES);
    form.setValue('images', next, { shouldValidate: true, shouldDirty: true });
  }

  function removeImage(index: number) {
    form.setValue(
      'images',
      images.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  }

  async function handleSubmit(values: OfferInput) {
    try {
      await onSubmit(values);
      toast.success(offer ? t('updated') : t('created'));
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
          form.reset(defaultValues);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{offer ? t('editTitle') : t('newTitle')}</DialogTitle>
          <DialogDescription>{offer ? t('editDescription') : t('newDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('titleLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('descriptionLabel')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tagLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('tagPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>{t('imagesLabel')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {images.map((image, index) => (
                        <div
                          key={typeof image === 'string' ? image : `${image.name}-${index}`}
                          className="relative size-20 overflow-hidden rounded-lg border border-border"
                        >
                          <img src={imagePreviewUrl(image)} alt="" className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={t('removeImage')}
                            className="absolute top-1 end-1 grid size-5 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                      {images.length < MAX_OFFER_IMAGES && (
                        <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent">
                          <ImagePlus className="size-5" />
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                              addImages(event.target.files);
                              event.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('imagesHint')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-3">
                  <FormLabel>{t('activeLabel')}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('saving') : offer ? t('saveChanges') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
