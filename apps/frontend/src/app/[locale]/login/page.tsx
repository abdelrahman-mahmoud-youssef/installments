'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoMark } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Link, useRouter } from '@/i18n/navigation';
import { login, verifyTwoFactor } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import {
  LoginInput,
  loginSchema,
  TwoFactorCodeInput,
  twoFactorCodeSchema,
} from '@/lib/schemas/auth';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const codeForm = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const result = await login(values);
      if ('requiresTwoFactor' in result) {
        setChallengeToken(result.challengeToken);
        return;
      }
      router.push(routes.dashboard);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.message === 'This account has been deactivated.') {
        setServerError(t('accountDeactivated'));
      } else {
        setServerError(error instanceof ApiError ? error.message : t('genericError'));
      }
    }
  }

  async function onSubmitCode(values: TwoFactorCodeInput) {
    if (!challengeToken) {
      return;
    }
    setServerError(null);
    try {
      await verifyTwoFactor(challengeToken, values.code);
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
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {challengeToken ? t('twoFactorTitle') : t('title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {challengeToken ? t('twoFactorDescription') : t('description')}
            </p>
          </div>
        </div>

        {challengeToken ? (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('twoFactorCodeLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        {...field}
                      />
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
              <Button type="submit" size="lg" className="w-full" disabled={codeForm.formState.isSubmitting}>
                {codeForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {codeForm.formState.isSubmitting ? t('submitting') : t('twoFactorSubmit')}
              </Button>
            </form>
          </Form>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>{t('password')}</FormLabel>
                      <Link
                        href={routes.forgotPassword}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {t('forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput autoComplete="current-password" placeholder="••••••••" {...field} />
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

        {!challengeToken && (
          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={routes.register} className="font-medium text-foreground hover:underline">
              {t('createOne')}
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
