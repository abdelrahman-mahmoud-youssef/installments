import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TWO_FACTOR_CODE_LENGTH, TWO_FACTOR_RECOVERY_CODE_MAX_LENGTH } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const { t } = useI18n();
  const { user, isAdmin, deleteAccount } = useAuth();
  const isTwoFactorEnabled = user?.twoFactorEnabled ?? false;
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setCode('');
      setError(null);
    }
  }, [visible]);

  const submit = async () => {
    const trimmedCode = code.trim();
    if (!password || (isTwoFactorEnabled && trimmedCode.length < TWO_FACTOR_CODE_LENGTH)) {
      setError(t('security.deleteAccountIncomplete'));
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount({ password, code: isTwoFactorEnabled ? trimmedCode : undefined });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.genericError'));
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={isDeleting ? () => undefined : onClose}
      title={t('security.deleteAccountTitle')}
    >
      <View style={{ gap: spacing.lg }}>
        <AppText tone="muted">
          {isAdmin ? t('security.deleteAccountOwnerDescription') : t('security.deleteAccountStaffDescription')}
        </AppText>
        <TextField
          label={t('security.currentPassword')}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          secureToggle
        />
        {isTwoFactorEnabled ? (
          <TextField
            label={t('security.disableCodeLabel')}
            placeholder={t('security.codePlaceholder')}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={TWO_FACTOR_RECOVERY_CODE_MAX_LENGTH}
          />
        ) : null}
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        <Button
          title={t('security.deleteAccount')}
          variant="destructive"
          onPress={() => void submit()}
          loading={isDeleting}
        />
      </View>
    </BottomSheet>
  );
}
