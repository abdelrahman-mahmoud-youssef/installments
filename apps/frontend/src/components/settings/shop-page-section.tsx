'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Camera, Copy, Link2, Loader2, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/shared/number-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useBranding, useUpdateBranding } from '@/hooks/use-branding';
import { ApiError } from '@/lib/api/client';
import { INSTALLMENT_PLAN_MONTHS, ShopPageInput, shopPageSchema } from '@/lib/schemas/branding';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function ShopPageSection() {
  const t = useTranslations('settings');
  const { data, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();

  const form = useForm<ShopPageInput>({
    resolver: zodResolver(shopPageSchema),
    values: {
      about: data?.about ?? '',
      instagramUrl: data?.instagramUrl ?? '',
      facebookUrl: data?.facebookUrl ?? '',
      tiktokUrl: data?.tiktokUrl ?? '',
    },
  });

  const [markupPercent, setMarkupPercent] = useState<number | undefined>(undefined);

  useEffect(() => {
    setMarkupPercent(data?.calculatorMarkupPercent ?? undefined);
  }, [data?.calculatorMarkupPercent]);

  async function handleSave(values: ShopPageInput) {
    try {
      await updateBranding.mutateAsync({
        about: values.about.trim(),
        instagramUrl: values.instagramUrl.trim(),
        facebookUrl: values.facebookUrl.trim(),
        tiktokUrl: values.tiktokUrl.trim(),
      });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleMarkupPercentBlur() {
    if (markupPercent === data?.calculatorMarkupPercent) {
      return;
    }
    try {
      await updateBranding.mutateAsync({ calculatorMarkupPercent: markupPercent ?? 0 });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleToggleCalculator(next: boolean) {
    try {
      await updateBranding.mutateAsync({ showInstallmentCalculator: next });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleToggleMonth(month: number) {
    const current = data?.calculatorInstallmentMonths ?? [];
    const next = current.includes(month)
      ? current.filter((existing) => existing !== month)
      : [...current, month].sort((a, b) => a - b);
    try {
      await updateBranding.mutateAsync({ calculatorInstallmentMonths: next });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  const shopUrl =
    typeof window !== 'undefined' && data ? `${window.location.origin}${routes.publicShop(data.publicId)}` : '';

  return (
    <Section title={t('shopPageTitle')} description={t('shopPageDescription')}>
      <div className="flex flex-col gap-6">
        {isLoading ? (
          <Skeleton className="h-9 w-full max-w-sm" />
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('shopLinkLabel')}</p>
            <div className="flex items-center gap-2">
              <Input dir="ltr" readOnly value={shopUrl} className="text-muted-foreground" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shopUrl);
                  toast.success(t('shopLinkCopied'));
                }}
              >
                <Copy className="size-4" />
                {t('copyLink')}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-40 w-full max-w-sm" />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>{t('aboutLabel')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder={t('aboutPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel className="flex items-center gap-1.5">
                      <Camera className="size-4" />
                      {t('instagramLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder={t('instagramPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel className="flex items-center gap-1.5">
                      <ThumbsUp className="size-4" />
                      {t('facebookLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder={t('facebookPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiktokUrl"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel className="flex items-center gap-1.5">
                      <Link2 className="size-4" />
                      {t('tiktokLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder={t('tiktokPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
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

        {isLoading ? (
          <Skeleton className="h-40 w-full max-w-sm" />
        ) : (
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Calculator className="size-4" />
                {t('calculatorLabel')}
              </div>
              <Switch
                checked={data?.showInstallmentCalculator ?? false}
                onCheckedChange={handleToggleCalculator}
                disabled={updateBranding.isPending}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('calculatorHint')}</p>

            {data?.showInstallmentCalculator && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="max-w-40">
                  <p className="mb-1.5 text-sm font-medium text-foreground">{t('calculatorMarkupLabel')}</p>
                  <NumberInput
                    step="1"
                    min="0"
                    value={markupPercent}
                    onChange={setMarkupPercent}
                    onBlur={handleMarkupPercentBlur}
                    disabled={updateBranding.isPending}
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">{t('calculatorPlansLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {INSTALLMENT_PLAN_MONTHS.map((month) => {
                      const isSelected = data?.calculatorInstallmentMonths.includes(month) ?? false;
                      return (
                        <button
                          key={month}
                          type="button"
                          aria-pressed={isSelected}
                          disabled={updateBranding.isPending}
                          onClick={() => handleToggleMonth(month)}
                          className={cn(
                            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-accent',
                          )}
                        >
                          {t('calculatorMonths', { count: month })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
