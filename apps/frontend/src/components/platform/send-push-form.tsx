'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSendPlatformPush } from '@/hooks/use-platform-push';
import { usePlatformTenants } from '@/hooks/use-platform-tenants';
import { ApiError } from '@/lib/api/client';
import { PUSH_AUDIENCES } from '@/lib/api/platform';
import { PlatformPushInput, platformPushSchema } from '@/lib/schemas/platform-push';

const SHOP_PICKER_LIMIT = 100;
const EMPTY_FORM: PlatformPushInput = { title: '', body: '', audience: 'ALL', tenantId: undefined };

export function SendPushForm() {
  const t = useTranslations('platform.notifications');
  const sendPush = useSendPlatformPush();
  const form = useForm<PlatformPushInput>({
    resolver: zodResolver(platformPushSchema),
    defaultValues: EMPTY_FORM,
  });
  const audience = form.watch('audience');
  const { data: tenants } = usePlatformTenants({ page: 1, limit: SHOP_PICKER_LIMIT });

  async function handleSubmit(values: PlatformPushInput) {
    try {
      const sent = await sendPush.mutateAsync({
        ...values,
        tenantId: values.audience === 'SHOP' ? values.tenantId : undefined,
      });
      toast.success(t('sent', { count: sent.recipientCount }));
      form.reset(EMPTY_FORM);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Section title={t('formTitle')}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex max-w-xl flex-col gap-4">
          <FormField
            control={form.control}
            name="audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('audienceLabel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(value: string | null) => (value ? t(`audience.${value}`) : '')}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PUSH_AUDIENCES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`audience.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {audience === 'SHOP' ? (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shopLabel')}</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string | null) =>
                            tenants?.data.find((tenant) => tenant.id === value)?.name ?? t('shopPlaceholder')
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(tenants?.data ?? []).map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
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
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('bodyLabel')}</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="self-start" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {form.formState.isSubmitting ? t('sending') : t('send')}
          </Button>
        </form>
      </Form>
    </Section>
  );
}
