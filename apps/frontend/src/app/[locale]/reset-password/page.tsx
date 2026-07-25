'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoMark } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { resetPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { ResetPasswordInput, resetPasswordSchema } from '@/lib/schemas/auth';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tCommon = useTranslations('common');
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

        {!token ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {t('missingToken')}
            </p>
            <Button size="lg" className="w-full" render={<Link href={routes.forgotPassword} />}>
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
                      <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
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
                      <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
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
      </div>
    </AuthShell>
  );
}
