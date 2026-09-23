import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useChangePassword } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { isValidPassword } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

interface ChangePasswordSheetProps {
  visible: boolean;
  onClose: () => void;
}

type FieldErrors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword' | 'api', string>>;

export function ChangePasswordSheet({ visible, onClose }: ChangePasswordSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const changeMutation = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [visible]);

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = t('common.requiredField');
    }
    if (!isValidPassword(newPassword)) {
      nextErrors.newPassword = t('auth.passwordTooShort');
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = t('security.passwordMismatch');
    }
    return nextErrors;
  };

  const submit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    try {
      await changeMutation.mutateAsync({ currentPassword, newPassword });
      onClose();
      showToast(t('security.passwordChanged'));
    } catch (caught) {
      setErrors({ api: caught instanceof ApiError ? caught.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={changeMutation.isPending ? () => undefined : onClose}
      title={t('security.changePassword')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('security.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={errors.currentPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          secureToggle
        />
        <TextField
          label={t('security.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          error={errors.newPassword}
          hint={t('security.changePasswordHint')}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureToggle
        />
        <TextField
          label={t('security.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureToggle
        />
        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void submit()} loading={changeMutation.isPending} />
      </View>
    </BottomSheet>
  );
}
