import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/auth-context';
import { resolveAuthErrorMessage } from '@/auth/resolve-auth-error';
import { AuthIntro } from '@/components/auth/auth-intro';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn, completeTwoFactor } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitCredentials = async () => {
    if (!email.trim() || !password) {
      setError(t('common.requiredField'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn(email.trim().toLowerCase(), password);
      if (result.status === 'twoFactor') {
        setChallengeToken(result.challengeToken);
      }
    } catch (caught) {
      setError(resolveAuthErrorMessage(caught, t));
    } finally {
      setSubmitting(false);
    }
  };

  const submitTwoFactor = async () => {
    if (!challengeToken || !code.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await completeTwoFactor(challengeToken, code.trim());
    } catch (caught) {
      setError(resolveAuthErrorMessage(caught, t));
    } finally {
      setSubmitting(false);
    }
  };

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
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.xl,
        }}
      >
        <AuthIntro
          title={challengeToken ? t('auth.twoFactorTitle') : t('auth.welcomeTitle')}
          subtitle={challengeToken ? t('auth.twoFactorSubtitle') : t('auth.welcomeSubtitle')}
        />

        {challengeToken ? (
          <View style={{ gap: spacing.lg }}>
            <TextField
              label={t('auth.code')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            {error ? (
              <AppText variant="caption" tone="danger">
                {error}
              </AppText>
            ) : null}
            <Button title={t('auth.verify')} onPress={() => void submitTwoFactor()} loading={submitting} />
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextField
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureToggle
              textContentType="password"
            />
            {error ? (
              <AppText variant="caption" tone="danger">
                {error}
              </AppText>
            ) : null}
            <Button title={t('auth.signIn')} onPress={() => void submitCredentials()} loading={submitting} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
              <AppText variant="caption" tone="muted">
                {t('auth.noAccount')}
              </AppText>
              <PressableScale onPress={() => router.push('/register')} accessibilityRole="link" hitSlop={8}>
                <AppText variant="caption" tone="primary" style={{ fontWeight: '600' }}>
                  {t('auth.createAccount')}
                </AppText>
              </PressableScale>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
