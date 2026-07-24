'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LogoEditDialog } from '@/components/settings/logo-edit-dialog';
import { Section } from '@/components/shared/section';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useBranding, useRemoveLogo, useUpdateBranding, useUploadLogo } from '@/hooks/use-branding';
import { ApiError } from '@/lib/api/client';
import { resolveAssetUrl } from '@/lib/assets';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import {
  DEFAULT_COUNTRY_CODE,
  normalizeLocalPhoneInput,
  toLocalPhoneNumber,
  toStoredPhoneNumber,
} from '@/lib/phone';
import { BRAND_COLOR_PRESETS, BrandingInput, brandingSchema } from '@/lib/schemas/branding';
import { cn } from '@/lib/utils';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function BrandingSection() {
  const t = useTranslations('settings');
  const { data, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();
  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  const form = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    values: {
      displayName: data?.displayName ?? '',
      phone: toLocalPhoneNumber(data?.phone),
      brandColor: data?.brandColor ?? BRAND_COLOR_PRESETS[0],
      showPublicPricing: data?.showPublicPricing ?? true,
    },
  });

  async function handleSaveDetails(values: BrandingInput) {
    try {
      await updateBranding.mutateAsync({
        displayName: values.displayName.trim(),
        phone: toStoredPhoneNumber(values.phone),
        brandColor: values.brandColor,
        showPublicPricing: values.showPublicPricing,
      });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  function onLogoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(t('logoTooLarge'));
      return;
    }
    setPendingLogoFile(file);
  }

  async function handleLogoConfirm(base64: string) {
    try {
      await uploadLogo.mutateAsync(base64);
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleRemoveLogo() {
    try {
      await removeLogo.mutateAsync();
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  const logoUrl = resolveAssetUrl(data?.logoUrl ?? null);
  const isBusy = uploadLogo.isPending || removeLogo.isPending;

  return (
    <Section title={t('brandingTitle')} description={t('brandingDescription')}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">{t('logoLabel')}</p>
          {isLoading ? (
            <Skeleton className="size-16 rounded-lg" />
          ) : (
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="size-16 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="grid size-16 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  {t('logoLabel')}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={onLogoSelected}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadLogo.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    {t('logoAdd')}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={handleRemoveLogo}
                    >
                      {removeLogo.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      {t('logoRemove')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t('logoHint')}</p>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full max-w-sm" />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveDetails)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="brandColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('colorLabel')}</FormLabel>
                    <p className="-mt-1 text-xs text-muted-foreground">{t('colorHint')}</p>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {BRAND_COLOR_PRESETS.map((preset) => {
                          const isSelected = field.value === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              aria-label={t(`brandColor_${preset}`)}
                              aria-pressed={isSelected}
                              onClick={() => field.onChange(preset)}
                              className={cn(
                                'grid size-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-shadow',
                                isSelected ? 'ring-foreground' : 'ring-transparent hover:ring-border',
                              )}
                              style={{ backgroundColor: BRAND_COLOR_VALUES[preset] }}
                            >
                              {isSelected && <Check className="size-4 text-white" strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>{t('displayNameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('displayNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>{t('phoneLabel')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2" dir="ltr">
                        <span className="flex h-9 shrink-0 items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
                          {DEFAULT_COUNTRY_CODE}
                        </span>
                        <Input
                          dir="ltr"
                          inputMode="numeric"
                          placeholder={t('phonePlaceholder')}
                          {...field}
                          onBlur={(event) => {
                            field.onChange(normalizeLocalPhoneInput(event.target.value));
                            field.onBlur();
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{t('phoneHint')}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showPublicPricing"
                render={({ field }) => (
                  <FormItem className="flex-row items-center justify-between gap-3 border-t border-border pt-5">
                    <div className="min-w-0">
                      <FormLabel>{t('publicPricingLabel')}</FormLabel>
                      <p className="text-xs text-muted-foreground">{t('publicPricingHint')}</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <Button type="submit" size="sm" disabled={updateBranding.isPending}>
                  {updateBranding.isPending && <Loader2 className="size-4 animate-spin" />}
                  {t('saveBranding')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      <LogoEditDialog
        file={pendingLogoFile}
        onOpenChange={(open) => {
          if (!open) {
            setPendingLogoFile(null);
          }
        }}
        onConfirm={handleLogoConfirm}
      />
    </Section>
  );
}
