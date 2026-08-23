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
import { register as registerBusiness } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { RegisterInput, registerSchema } from '@/lib/schemas/auth';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: '', name: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      await registerBusiness(values);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('businessName')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="organization" placeholder={t('businessNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder={t('namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" placeholder="••••••••" {...field} />
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

        <p className="text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link href={routes.login} className="font-medium text-foreground hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
