import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { SUPPORT_MESSAGE_MAX_LENGTH, SUPPORT_SUBJECT_MAX_LENGTH } from '@/api/support';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateSupportMessage } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

interface SupportFormSheetProps {
  visible: boolean;
  onClose: () => void;
}

type FieldErrors = Partial<Record<'subject' | 'message' | 'api', string>>;

export function SupportFormSheet({ visible, onClose }: SupportFormSheetProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createMutation = useCreateSupportMessage();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (visible) {
      setSubject('');
      setMessage('');
      setErrors({});
    }
  }, [visible]);

  const submit = async () => {
    const nextErrors: FieldErrors = {};
    if (!subject.trim()) {
      nextErrors.subject = t('common.requiredField');
    }
    if (!message.trim()) {
      nextErrors.message = t('common.requiredField');
    }
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.message) {
      return;
    }
    try {
      await createMutation.mutateAsync({ subject: subject.trim(), message: message.trim() });
      onClose();
      showToast(t('support.sent'));
    } catch (caught) {
      setErrors({ api: caught instanceof ApiError ? caught.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={createMutation.isPending ? () => undefined : onClose}
      title={t('support.newMessage')}
    >
      <View style={{ gap: spacing.lg }}>
        {user ? (
          <AppText variant="caption" tone="muted">
            {t('support.sendingAs', { name: user.name, email: user.email })}
          </AppText>
        ) : null}
        <TextField
          label={t('support.subject')}
          placeholder={t('support.subjectPlaceholder')}
          value={subject}
          onChangeText={setSubject}
          error={errors.subject}
          maxLength={SUPPORT_SUBJECT_MAX_LENGTH}
        />
        <TextField
          label={t('support.message')}
          placeholder={t('support.messagePlaceholder')}
          value={message}
          onChangeText={setMessage}
          error={errors.message}
          maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
          multiline
        />
        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button
          title={t('support.send')}
          icon="paper-plane-outline"
          onPress={() => void submit()}
          loading={createMutation.isPending}
        />
      </View>
    </BottomSheet>
  );
}
