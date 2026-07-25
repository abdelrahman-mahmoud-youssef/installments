'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoMark } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { forgotPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { ForgotPasswordInput, forgotPasswordSchema } from '@/lib/schemas/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
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
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 lg:hidden">
            <LogoMark className="size-9" />
            <span className="font-semibold tracking-tight">{tCommon('appName')}</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-8 text-center">
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
                      <Input type="email" autoComplete="email" placeholder="you@business.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                  {serverError}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href={routes.login} className="font-medium text-foreground hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
