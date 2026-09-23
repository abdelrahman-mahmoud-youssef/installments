import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateStaff } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { isValidEmail, isValidPassword } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

interface StaffFormSheetProps {
  visible: boolean;
  onClose: () => void;
}

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'api', string>>;

export function StaffFormSheet({ visible, onClose }: StaffFormSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const createMutation = useCreateStaff();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setEmail('');
      setPassword('');
      setErrors({});
    }
  }, [visible]);

  const normalizedEmail = email.trim().toLowerCase();

  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = t('common.requiredField');
    }
    if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = t('auth.invalidEmail');
    }
    if (!isValidPassword(password)) {
      nextErrors.password = t('auth.passwordTooShort');
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
      await createMutation.mutateAsync({ name: name.trim(), email: normalizedEmail, password });
      onClose();
      showToast(t('staff.added'));
    } catch (caught) {
      setErrors({ api: caught instanceof ApiError ? caught.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={createMutation.isPending ? () => undefined : onClose}
      title={t('staff.addStaff')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField label={t('staff.name')} value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label={t('staff.email')}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextField
          label={t('staff.password')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint={t('staff.passwordHint')}
          autoCapitalize="none"
          secureToggle
        />
        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void submit()} loading={createMutation.isPending} />
      </View>
    </BottomSheet>
  );
}
