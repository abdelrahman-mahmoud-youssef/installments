'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Mail, MessageCircle, Send, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotificationSettings,
  useSendTestNotification,
  useUpdateNotificationSettings,
} from '@/hooks/use-settings';
import { ApiError } from '@/lib/api/client';
import { NotificationSettingsInput, notificationSettingsSchema } from '@/lib/schemas/settings';

const setupSteps = ['step1', 'step2', 'step3', 'step4'] as const;
const comingSoonChannels: { key: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'channelEmail', icon: Mail },
  { key: 'channelWhatsapp', icon: MessageCircle },
  { key: 'channelSms', icon: Smartphone },
];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { data, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const sendTest = useSendTestNotification();

  const form = useForm<NotificationSettingsInput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: { telegramBotToken: '' },
  });

  async function handleSubmit(values: NotificationSettingsInput) {
    const token = values.telegramBotToken.trim();
    if (!token && !data?.telegramConfigured) {
      form.setError('telegramBotToken', { message: t('tokenRequired') });
      return;
    }
    try {
      if (token) {
        await updateSettings.mutateAsync({ telegramBotToken: token });
      }
      await sendTest.mutateAsync();
      toast.success(t('testSent'));
      form.reset({ telegramBotToken: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="mx-auto w-full max-w-2xl space-y-6">
        <Section
          title={t('telegramTitle')}
          description={t('telegramDescription')}
          action={
            isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : data?.telegramConfigured ? (
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
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
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
                      {data?.telegramConfigured && (
                        <p className="text-xs text-muted-foreground">{t('replaceHint')}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {data?.telegramChatId && (
                  <p className="text-xs text-muted-foreground">
                    {t('connectedChat', { chatId: data.telegramChatId })}
                  </p>
                )}

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
          )}

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
      </FadeIn>
    </div>
  );
}
