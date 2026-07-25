'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useSubmitSupportMessage } from '@/hooks/use-support';
import { ApiError } from '@/lib/api/client';
import { SupportMessageInput, supportMessageSchema } from '@/lib/schemas/support';

export default function SupportPage() {
  const t = useTranslations('support');
  const { data: currentUser } = useCurrentUser();
  const submitMessage = useSubmitSupportMessage();

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
    </div>
  );
}
