'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthShell } from '@/components/auth/auth-shell';
import { FormServerError } from '@/components/auth/form-server-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TextLink } from '@/components/ui/text-link';
import { forgotPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { ForgotPasswordInput, forgotPasswordSchema } from '@/lib/schemas/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await forgotPassword(values.email);
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <AuthShell>
      <div className="space-y-8">
        <AuthHeader title={t('title')} description={t('description')} />

        {submitted ? (
          <div
            role="status"
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-5 py-8 text-center shadow-xs"
          >
            <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success">
              <MailCheck className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">{t('checkYourEmail')}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input
                        inputSize="lg"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        placeholder={t('emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && <FormServerError message={serverError} />}
              <Button type="submit" size="xl" className="w-full" loading={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <TextLink href={routes.login}>
            {t('backToLogin')}
          </TextLink>
        </p>
      </div>
    </AuthShell>
  );
}
