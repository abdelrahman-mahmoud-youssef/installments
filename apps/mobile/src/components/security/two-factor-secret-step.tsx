import { useState } from 'react';
import { Linking, View } from 'react-native';
import { TWO_FACTOR_CODE_LENGTH, TwoFactorSetup } from '@/api/auth';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useShareText } from '@/hooks/use-share-text';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { MonospaceBlock } from './monospace-block';

const DIGITS_ONLY_PATTERN = /^\d+$/;

interface TwoFactorSecretStepProps {
  setup: TwoFactorSetup;
  confirming: boolean;
  error: string | null;
  onConfirm: (code: string) => void;
}

export function TwoFactorSecretStep({ setup, confirming, error, onConfirm }: TwoFactorSecretStepProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const shareText = useShareText();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const openAuthenticator = async () => {
    try {
      await Linking.openURL(setup.otpauthUrl);
    } catch {
      showToast(t('security.openAuthenticatorFailed'), 'error');
    }
  };

  const submit = () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== TWO_FACTOR_CODE_LENGTH || !DIGITS_ONLY_PATTERN.test(trimmedCode)) {
      setCodeError(t('security.codeInvalid'));
      return;
    }
    setCodeError(null);
    onConfirm(trimmedCode);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('security.setupDescription')}
      </AppText>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('security.secretLabel')}
        </AppText>
        <MonospaceBlock lines={[setup.secret]} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Button
          title={t('security.openInAuthenticator')}
          icon="open-outline"
          variant="secondary"
          onPress={() => void openAuthenticator()}
        />
        <Button
          title={t('security.shareSecret')}
          icon="share-outline"
          variant="ghost"
          onPress={() => void shareText(setup.secret)}
        />
      </View>
      <TextField
        label={t('security.codeLabel')}
        placeholder={t('security.codePlaceholder')}
        value={code}
        onChangeText={setCode}
        error={codeError ?? error ?? undefined}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={TWO_FACTOR_CODE_LENGTH}
      />
      <Button title={t('security.confirmEnable')} onPress={submit} loading={confirming} />
    </View>
  );
}
