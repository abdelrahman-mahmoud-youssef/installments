import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/auth-context';
import { resolveAuthErrorMessage } from '@/auth/resolve-auth-error';
import { AuthIntro } from '@/components/auth/auth-intro';
import { StepIndicator } from '@/components/auth/step-indicator';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { isValidEmail, isValidPassword } from '@/lib/validation';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

const TOTAL_STEPS = 2;
const STEP_FADE_DURATION = 220;

type FieldErrors = Partial<Record<'businessName' | 'name' | 'email' | 'password', string>>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const stepOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    stepOpacity.setValue(0);
    Animated.timing(stepOpacity, { toValue: 1, duration: STEP_FADE_DURATION, useNativeDriver: true }).start();
  }, [step, stepOpacity]);

  const goToAccountStep = () => {
    const nextErrors: FieldErrors = {};
    if (!businessName.trim()) {
      nextErrors.businessName = t('common.requiredField');
    }
    if (!name.trim()) {
      nextErrors.name = t('common.requiredField');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(1);
    }
  };

  const submit = async () => {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = t('auth.invalidEmail');
    }
    if (!isValidPassword(password)) {
      nextErrors.password = t('auth.passwordTooShort');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setApiError(null);
    try {
      await register({ businessName: businessName.trim(), name: name.trim(), email: normalizedEmail, password });
    } catch (caught) {
      setApiError(resolveAuthErrorMessage(caught, t));
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel = t('register.stepOf', {
    step: formatNumber(step + 1, locale),
    total: formatNumber(TOTAL_STEPS, locale),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.xxl,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.xl,
        }}
      >
        <AuthIntro title={t('register.title')} subtitle={t('register.subtitle')} />
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} label={stepLabel} />

        <Animated.View style={{ opacity: stepOpacity, gap: spacing.lg }}>
          <AppText variant="heading">{step === 0 ? t('register.businessStep') : t('register.accountStep')}</AppText>
          {step === 0 ? (
            <>
              <TextField
                label={t('register.businessName')}
                placeholder={t('register.businessNamePlaceholder')}
                value={businessName}
                onChangeText={setBusinessName}
                error={errors.businessName}
                maxLength={200}
                autoFocus
              />
              <TextField
                label={t('register.name')}
                placeholder={t('register.namePlaceholder')}
                value={name}
                onChangeText={setName}
                error={errors.name}
                textContentType="name"
                maxLength={200}
              />
              <Button title={t('register.continue')} icon="arrow-forward-outline" onPress={goToAccountStep} />
            </>
          ) : (
            <>
              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoFocus
              />
              <TextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                hint={t('register.passwordHint')}
                secureToggle
                textContentType="newPassword"
              />
              {apiError ? (
                <AppText variant="caption" tone="danger">
                  {apiError}
                </AppText>
              ) : null}
              <Button title={t('register.create')} onPress={() => void submit()} loading={submitting} />
              <Button title={t('common.back')} variant="ghost" onPress={() => setStep(0)} disabled={submitting} />
            </>
          )}
        </Animated.View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
          <AppText variant="caption" tone="muted">
            {t('auth.haveAccount')}
          </AppText>
          <PressableScale onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
            <AppText variant="caption" tone="primary" style={{ fontWeight: '600' }}>
              {t('auth.signInInstead')}
            </AppText>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
