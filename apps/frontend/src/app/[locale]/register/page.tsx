'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthShell } from '@/components/auth/auth-shell';
import { StepIndicator } from '@/components/auth/step-indicator';
import { FormServerError } from '@/components/auth/form-server-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { TextLink } from '@/components/ui/text-link';
import { useRouter } from '@/i18n/navigation';
import { register as registerBusiness } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { RegisterInput, registerSchema } from '@/lib/schemas/auth';

const TOTAL_STEPS = 2;
const STEP_ONE_FIELDS = ['businessName', 'name'] as const;

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: '', name: '', email: '', password: '' },
  });

  async function goToNextStep() {
    const isValid = await form.trigger(STEP_ONE_FIELDS);
    if (isValid) {
      setStep(2);
    }
  }

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

  const isFirstStep = step === 1;

  return (
    <AuthShell>
      <div className="space-y-8">
        <StepIndicator current={step} total={TOTAL_STEPS} />
        <AuthHeader
          title={isFirstStep ? t('step1Title') : t('step2Title')}
          description={isFirstStep ? t('step1Description') : t('step2Description')}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {isFirstStep ? (
              <>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('businessName')}</FormLabel>
                      <FormControl>
                        <Input
                          inputSize="lg"
                          autoComplete="organization"
                          placeholder={t('businessNamePlaceholder')}
                          {...field}
                        />
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
                        <Input inputSize="lg" autoComplete="name" placeholder={t('namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" size="xl" className="w-full" onClick={() => void goToNextStep()}>
                  {t('next')}
                  <ArrowRight className="size-4 rtl:-scale-x-100" />
                </Button>
              </>
            ) : (
              <>
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
                          autoFocus
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
                      <FormLabel>{t('password')}</FormLabel>
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
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    type="button"
                    size="xl"
                    variant="ghost"
                    disabled={form.formState.isSubmitting}
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="size-4 rtl:-scale-x-100" />
                    {t('back')}
                  </Button>
                  <Button type="submit" size="xl" className="flex-1" loading={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('submitting') : t('submit')}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <TextLink href={routes.login}>
            {t('signIn')}
          </TextLink>
        </p>
      </div>
    </AuthShell>
  );
}
