import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TWO_FACTOR_CODE_LENGTH, TWO_FACTOR_RECOVERY_CODE_MAX_LENGTH } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useDisableTwoFactor } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

interface TwoFactorDisableSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TwoFactorDisableSheet({ visible, onClose }: TwoFactorDisableSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const disableMutation = useDisableTwoFactor();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
    }
  }, [visible]);

  const submit = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < TWO_FACTOR_CODE_LENGTH) {
      setError(t('security.disableCodeInvalid'));
      return;
    }
    setError(null);
    try {
      await disableMutation.mutateAsync(trimmedCode);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.genericError'));
      return;
    }
    showToast(t('security.twoFactorDisabled'));
    onClose();
    await refreshUser().catch(() => showToast(t('common.genericError'), 'error'));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={disableMutation.isPending ? () => undefined : onClose}
      title={t('security.disableTitle')}
    >
      <View style={{ gap: spacing.lg }}>
        <AppText variant="caption" tone="muted">
          {t('security.disableDescription')}
        </AppText>
        <TextField
          label={t('security.disableCodeLabel')}
          placeholder={t('security.codePlaceholder')}
          value={code}
          onChangeText={setCode}
          error={error ?? undefined}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={TWO_FACTOR_RECOVERY_CODE_MAX_LENGTH}
        />
        <Button
          title={t('security.disableTwoFactor')}
          variant="destructive"
          onPress={() => void submit()}
          loading={disableMutation.isPending}
        />
      </View>
    </BottomSheet>
  );
}
