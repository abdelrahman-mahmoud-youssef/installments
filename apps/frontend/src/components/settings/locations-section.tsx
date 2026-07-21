'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useBranding, useUpdateBranding } from '@/hooks/use-branding';
import { ApiError } from '@/lib/api/client';
import { LocationsFormInput, locationsFormSchema, MAX_LOCATIONS } from '@/lib/schemas/branding';

function createLocationId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function LocationsSection() {
  const t = useTranslations('settings');
  const { data, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();

  const form = useForm<LocationsFormInput>({
    resolver: zodResolver(locationsFormSchema),
    values: { locations: data?.locations.map((location) => ({ ...location, mapUrl: location.mapUrl ?? '' })) ?? [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'locations' });

  async function handleSave(values: LocationsFormInput) {
    try {
      await updateBranding.mutateAsync({
        locations: values.locations.map((location) => ({
          ...location,
          name: location.name.trim(),
          address: location.address.trim(),
          mapUrl: location.mapUrl.trim() || undefined,
        })),
      });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="border-t border-border pt-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="size-4" />
        {t('locationsLabel')}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t('locationsHint')}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="mt-4 flex max-w-lg flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <FormField
                    control={form.control}
                    name={`locations.${index}.name`}
                    render={({ field: nameField }) => (
                      <FormItem>
                        <FormLabel>{t('locationNameLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('locationNamePlaceholder')} {...nameField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.address`}
                    render={({ field: addressField }) => (
                      <FormItem>
                        <FormLabel>{t('locationAddressLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('locationAddressPlaceholder')} {...addressField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.mapUrl`}
                    render={({ field: mapUrlField }) => (
                      <FormItem>
                        <FormLabel>{t('locationMapUrlLabel')}</FormLabel>
                        <FormControl>
                          <Input dir="ltr" placeholder={t('locationMapUrlPlaceholder')} {...mapUrlField} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">{t('locationMapUrlHint')}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t('locationRemove')}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= MAX_LOCATIONS}
              onClick={() => append({ id: createLocationId(), name: '', address: '', mapUrl: '' })}
            >
              <Plus className="size-4" />
              {t('locationAdd')}
            </Button>
            <Button type="submit" size="sm" disabled={updateBranding.isPending}>
              {updateBranding.isPending && <Loader2 className="size-4 animate-spin" />}
              {t('saveBranding')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
