'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthShell } from '@/components/auth/auth-shell';
import { FormServerError } from '@/components/auth/form-server-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/navigation';
import { resetPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { ResetPasswordInput, resetPasswordSchema } from '@/lib/schemas/auth';

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      return;
    }
    setServerError(null);
    try {
      await resetPassword({ token, newPassword: values.newPassword });
      router.push(routes.dashboard);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeader title={t('title')} description={t('description')} />

      {!token ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {t('missingToken')}
          </p>
          <Button size="xl" className="w-full" render={<Link href={routes.forgotPassword} />}>
            {t('requestNewLink')}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      inputSize="lg"
                      autoComplete="new-password"
                      placeholder={t('passwordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('confirmPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      inputSize="lg"
                      autoComplete="new-password"
                      placeholder={t('passwordPlaceholder')}
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
    </div>
  );
}
