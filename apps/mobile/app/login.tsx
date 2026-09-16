import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, NetworkError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn, completeTwoFactor } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolveErrorMessage = (caught: unknown): string => {
    if (caught instanceof NetworkError) {
      return t('common.networkError');
    }
    if (caught instanceof ApiError) {
      return caught.message;
    }
    return t('common.genericError');
  };

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
      setError(resolveErrorMessage(caught));
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
      setError(resolveErrorMessage(caught));
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
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.xl,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="wallet" size={34} color={colors.primary} />
          </View>
          <AppText variant="largeTitle" align="center">
            {challengeToken ? t('auth.twoFactorTitle') : t('auth.welcomeTitle')}
          </AppText>
          <AppText variant="caption" tone="muted" align="center">
            {challengeToken ? t('auth.twoFactorSubtitle') : t('auth.welcomeSubtitle')}
          </AppText>
        </View>

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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
