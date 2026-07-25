'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMarkSupportRepliesSeen, useSubmitSupportMessage, useSupportMessages } from '@/hooks/use-support';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { SupportMessageInput, supportMessageSchema } from '@/lib/schemas/support';

export default function SupportPage() {
  const t = useTranslations('support');
  const locale = useLocale();
  const { data: currentUser } = useCurrentUser();
  const { data: messages } = useSupportMessages();
  const submitMessage = useSubmitSupportMessage();
  const markSeen = useMarkSupportRepliesSeen();
  const hasMarkedSeen = useRef(false);

  const hasUnseenReply = (messages ?? []).some((message) => message.adminReply && !message.seenAt);

  useEffect(() => {
    if (hasUnseenReply && !hasMarkedSeen.current) {
      hasMarkedSeen.current = true;
      markSeen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnseenReply]);

  const form = useForm<SupportMessageInput>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: { subject: '', message: '' },
  });

  async function handleSubmit(values: SupportMessageInput) {
    try {
      await submitMessage.mutateAsync(values);
      toast.success(t('sent'));
      form.reset({ subject: '', message: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('subjectLabel')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('messageLabel')}</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {currentUser && (
                <p className="text-xs text-muted-foreground">
                  {t('sendingAs', { name: currentUser.name, email: currentUser.email })}
                </p>
              )}
              <Button type="submit" className="self-start" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {form.formState.isSubmitting ? t('sending') : t('submit')}
              </Button>
            </form>
          </Form>
        </div>
      </FadeIn>

      {messages && messages.length > 0 && (
        <FadeIn delay={0.1} className="mx-auto w-full max-w-2xl space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t('previousSubmissions')}</h2>
          {messages.map((message) => (
            <div key={message.id} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{message.subject}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(message.createdAt, locale)}</p>
                </div>
                {message.adminReply && (
                  <Badge variant="secondary" className="shrink-0">
                    {t('replied')}
                  </Badge>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{message.message}</p>
              {message.adminReply && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">{t('replyLabel')}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{message.adminReply}</p>
                  {message.repliedAt && (
                    <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(message.repliedAt, locale)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </FadeIn>
      )}
    </div>
  );
}
