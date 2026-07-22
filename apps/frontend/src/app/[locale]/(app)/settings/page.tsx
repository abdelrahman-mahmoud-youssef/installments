'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  Palette,
  Send,
  Smartphone,
  Store,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { type ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import { FaWhatsapp } from 'react-icons/fa6';
import { toast } from 'sonner';
import { FadeIn } from '@/components/shared/motion';
import {
  NotificationLanguage,
  NotificationLanguageToggle,
} from '@/components/shared/notification-language-toggle';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { BrandingSection } from '@/components/settings/branding-section';
import { InstallAppDialog } from '@/components/settings/install-app-dialog';
import { PaymentMethodsSection } from '@/components/settings/payment-methods-section';
import { ShopPageSection } from '@/components/settings/shop-page-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDisconnectNotifications,
  useNotificationSettings,
  useSendTestNotification,
  useSetNotificationLanguage,
  useUpdateNotificationSettings,
} from '@/hooks/use-settings';
import { ApiError } from '@/lib/api/client';
import { NotificationSettingsInput, notificationSettingsSchema } from '@/lib/schemas/settings';

const setupSteps = ['step1', 'step2', 'step3', 'step4'] as const;
const comingSoonChannels: { key: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'channelEmail', icon: Mail },
  { key: 'channelWhatsapp', icon: FaWhatsapp },
  { key: 'channelSms', icon: Smartphone },
];

const VALID_TABS = ['branding', 'shopPage', 'paymentMethods', 'notifications'] as const;

export default function SettingsPage() {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = VALID_TABS.find((tab) => tab === requestedTab) ?? 'branding';
  const { data, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const sendTest = useSendTestNotification();
  const disconnect = useDisconnectNotifications();
  const setLanguage = useSetNotificationLanguage();
  const isConnected = Boolean(data?.telegramConfigured);

  const form = useForm<NotificationSettingsInput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: { telegramBotToken: '' },
  });

  async function handleConnect(values: NotificationSettingsInput) {
    const token = values.telegramBotToken.trim();
    if (!token) {
      form.setError('telegramBotToken', { message: t('tokenRequired') });
      return;
    }
    try {
      await updateSettings.mutateAsync({ telegramBotToken: token });
      await sendTest.mutateAsync();
      toast.success(t('testSent'));
      form.reset({ telegramBotToken: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleSendDemo() {
    try {
      await sendTest.mutateAsync();
      toast.success(t('testSent'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleRemove() {
    try {
      await disconnect.mutateAsync();
      toast.success(t('removed'));
      form.reset({ telegramBotToken: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleLanguageChange(language: NotificationLanguage) {
    try {
      await setLanguage.mutateAsync(language);
      toast.success(t('languageSaved'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} actions={<InstallAppDialog />} />
      </FadeIn>

      <FadeIn delay={0.05} className="mx-auto w-full max-w-2xl">
        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-6 w-full p-1">
            <TabsTrigger value="branding" className="gap-2 text-sm">
              <Palette className="size-4" />
              {t('tabBranding')}
            </TabsTrigger>
            <TabsTrigger value="shopPage" className="gap-2 text-sm">
              <Store className="size-4" />
              {t('tabShopPage')}
            </TabsTrigger>
            <TabsTrigger value="paymentMethods" className="gap-2 text-sm">
              <Wallet className="size-4" />
              {t('tabPaymentMethods')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-sm">
              <Bell className="size-4" />
              {t('tabNotifications')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <BrandingSection />
          </TabsContent>

          <TabsContent value="shopPage">
            <ShopPageSection />
          </TabsContent>

          <TabsContent value="paymentMethods">
            <PaymentMethodsSection />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Section
              title={t('telegramTitle')}
              description={t('telegramDescription')}
              action={
                isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : isConnected ? (
                  <Badge variant="secondary">
                    <CheckCircle2 className="size-3" />
                    {t('connected')}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t('notConnected')}</Badge>
                )
              }
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ) : isConnected ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    {data?.telegramChatId
                      ? t('connectedChat', { chatId: data.telegramChatId })
                      : t('connectedDescription')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSendDemo} disabled={sendTest.isPending || disconnect.isPending}>
                      {sendTest.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {sendTest.isPending ? t('sending') : t('sendDemo')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemove}
                      disabled={sendTest.isPending || disconnect.isPending}
                    >
                      {disconnect.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      {t('remove')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleConnect)} className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="telegramBotToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('tokenLabel')}</FormLabel>
                            <FormControl>
                              <Input
                                dir="ltr"
                                autoComplete="off"
                                placeholder={t('tokenPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                          {form.formState.isSubmitting ? t('sending') : t('connectAndTest')}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <div className="mt-6 border-t border-border pt-5">
                    <h3 className="mb-3 text-sm font-medium text-foreground">{t('stepsTitle')}</h3>
                    <ol className="space-y-3">
                      {setupSteps.map((step, index) => (
                        <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <span>{t(step)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {!isLoading && data && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('languageLabel')}</p>
                    <p className="text-xs text-muted-foreground">{t('languageHint')}</p>
                  </div>
                  <NotificationLanguageToggle
                    value={data.notificationLanguage}
                    onChange={handleLanguageChange}
                    disabled={setLanguage.isPending}
                  />
                </div>
              )}
            </Section>

            <Section title={t('moreChannelsTitle')} description={t('moreChannelsDescription')}>
              <ul className="space-y-2.5">
                {comingSoonChannels.map(({ key, icon: Icon }) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <Icon className="size-4" />
                      {t(key)}
                    </span>
                    <Badge variant="outline">{t('comingSoon')}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
