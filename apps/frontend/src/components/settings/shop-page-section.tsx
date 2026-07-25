'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Copy, Link2, Loader2, MapPin, Share2 } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa6';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AboutEditor } from '@/components/settings/about-editor';
import { LocationsSection } from '@/components/settings/locations-section';
import { NumberInput } from '@/components/shared/number-input';
import { Section } from '@/components/shared/section';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useBranding, useUpdateBranding } from '@/hooks/use-branding';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import {
  INSTALLMENT_PLAN_MONTHS,
  ShopPageInput,
  shopPageSchema,
  SlugInput,
  slugSchema,
} from '@/lib/schemas/branding';

export function ShopPageSection() {
  const t = useTranslations('settings');
  const { data, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();

  const shopOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const slugForm = useForm<SlugInput>({
    resolver: zodResolver(slugSchema),
    values: { slug: data?.slug ?? '' },
  });

  async function handleSaveSlug(values: SlugInput) {
    try {
      await updateBranding.mutateAsync({ slug: values.slug });
      toast.success(t('brandingSaved'));
    } catch (error) {
      if (error instanceof ApiError) {
        slugForm.setError('slug', { message: error.message });
      } else {
        toast.error(t('genericError'));
      }
    }
  }

  function handleCopyLink() {
    const slug = data?.slug ?? '';
    navigator.clipboard.writeText(`${shopOrigin}${routes.publicShop(slug)}`);
    toast.success(t('shopLinkCopied'));
  }

  const form = useForm<ShopPageInput>({
    resolver: zodResolver(shopPageSchema),
    values: {
      about: data?.about ?? '',
      instagramUrl: data?.instagramUrl ?? '',
      facebookUrl: data?.facebookUrl ?? '',
      tiktokUrl: data?.tiktokUrl ?? '',
    },
  });

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

  const [calculatorEnabled, setCalculatorEnabled] = useState(false);
  const [enabledMonths, setEnabledMonths] = useState<Set<number>>(new Set());
  const [planRates, setPlanRates] = useState<Record<number, number | undefined>>({});

  useEffect(() => {
    if (!data) {
      return;
    }
    setCalculatorEnabled(data.showInstallmentCalculator);
    setEnabledMonths(new Set(data.calculatorPlans.map((plan) => plan.months)));
    setPlanRates(Object.fromEntries(data.calculatorPlans.map((plan) => [plan.months, plan.markupPercent])));
  }, [data]);

  function toggleMonth(month: number, next: boolean) {
    setEnabledMonths((previous) => {
      const updated = new Set(previous);
      if (next) {
        updated.add(month);
      } else {
        updated.delete(month);
      }
      return updated;
    });
  }

  async function handleSaveCalculator() {
    const plans = INSTALLMENT_PLAN_MONTHS.filter((month) => enabledMonths.has(month)).map((month) => ({
      months: month,
      markupPercent: planRates[month] ?? 0,
    }));
    try {
      await updateBranding.mutateAsync({ showInstallmentCalculator: calculatorEnabled, calculatorPlans: plans });
      toast.success(t('brandingSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  if (isLoading) {
    return (
      <Section title={t('shopPageTitle')} description={t('shopPageDescription')}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full max-w-sm" />
          <Skeleton className="h-40 w-full max-w-sm" />
          <Skeleton className="h-40 w-full max-w-sm" />
        </div>
      </Section>
    );
  }

  return (
    <Section title={t('shopPageTitle')} description={t('shopPageDescription')}>
      <Accordion multiple defaultValue={['shopLink']} className="flex flex-col gap-1">
        <AccordionItem value="shopLink">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Link2 className="size-4" />
              {t('shopLinkSectionTitle')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Form {...slugForm}>
              <form onSubmit={slugForm.handleSubmit(handleSaveSlug)} className="flex flex-col gap-2">
                <FormField
                  control={slugForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shopLinkLabel')}</FormLabel>
                      <FormControl>
                        <div
                          className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card shadow-xs"
                          dir="ltr"
                        >
                          <span className="flex max-w-[50%] shrink-0 items-center truncate border-r border-border bg-muted px-3 text-sm text-muted-foreground">
                            {shopOrigin}
                            {routes.publicShop('')}
                          </span>
                          <Input
                            dir="ltr"
                            className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={updateBranding.isPending}>
                    {updateBranding.isPending && <Loader2 className="size-4 animate-spin" />}
                    {t('saveBranding')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="size-4" />
                    {t('copyLink')}
                  </Button>
                </div>
              </form>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="aboutSocial">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Share2 className="size-4" />
              {t('aboutSectionTitle')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem className="max-w-2xl">
                      <FormLabel>{t('aboutLabel')}</FormLabel>
                      <FormControl>
                        <AboutEditor value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{t('aboutHint')}</p>
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
                        <FaInstagram className="size-4" />
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
                        <FaFacebookF className="size-4" />
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
                        <FaTiktok className="size-4" />
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="calculator">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Calculator className="size-4" />
              {t('calculatorLabel')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t('calculatorHint')}</p>
              <Switch
                checked={calculatorEnabled}
                onCheckedChange={setCalculatorEnabled}
                disabled={updateBranding.isPending}
              />
            </div>

            {calculatorEnabled && (
              <div className="mt-4 max-w-sm">
                <p className="mb-2 text-sm font-medium text-foreground">{t('calculatorPlansLabel')}</p>
                <div className="space-y-2.5">
                  {INSTALLMENT_PLAN_MONTHS.map((month) => {
                    const isEnabled = enabledMonths.has(month);
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(next) => toggleMonth(month, next)}
                          disabled={updateBranding.isPending}
                        />
                        <span className="w-24 shrink-0 text-sm">{t('calculatorMonths', { count: month })}</span>
                        <NumberInput
                          step="1"
                          min="0"
                          disabled={!isEnabled || updateBranding.isPending}
                          value={planRates[month]}
                          onChange={(value) =>
                            setPlanRates((previous) => ({ ...previous, [month]: value }))
                          }
                          placeholder={t('calculatorMarkupLabel')}
                        />
                        <span className="shrink-0 text-sm text-muted-foreground">%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button type="button" size="sm" onClick={handleSaveCalculator} disabled={updateBranding.isPending}>
                {updateBranding.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('saveBranding')}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="locations">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <MapPin className="size-4" />
              {t('locationsLabel')}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="mb-3 text-xs text-muted-foreground">{t('locationsHint')}</p>
            <LocationsSection showHeading={false} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
}
