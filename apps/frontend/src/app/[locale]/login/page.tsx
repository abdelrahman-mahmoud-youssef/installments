'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthShell } from '@/components/auth/auth-shell';
import { FormServerError } from '@/components/auth/form-server-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { TextLink } from '@/components/ui/text-link';
import { useRouter } from '@/i18n/navigation';
import { DEACTIVATED_ACCOUNT_MESSAGE, login, verifyTwoFactor } from '@/lib/api/auth';
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
      if (error instanceof ApiError && error.message === DEACTIVATED_ACCOUNT_MESSAGE) {
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
        <AuthHeader
          title={challengeToken ? t('twoFactorTitle') : t('title')}
          description={challengeToken ? t('twoFactorDescription') : t('description')}
        />

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
                        inputSize="lg"
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder={t('twoFactorCodePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && <FormServerError message={serverError} />}
              <Button type="submit" size="xl" className="w-full" loading={codeForm.formState.isSubmitting}>
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>{t('password')}</FormLabel>
                      <TextLink href={routes.forgotPassword} className="text-sm">
                        {t('forgotPassword')}
                      </TextLink>
                    </div>
                    <FormControl>
                      <PasswordInput
                        inputSize="lg"
                        autoComplete="current-password"
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

        {!challengeToken && (
          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <TextLink href={routes.register}>
              {t('createOne')}
            </TextLink>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
