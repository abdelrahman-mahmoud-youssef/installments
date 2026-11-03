import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import {
  SUPPORT_IMAGE_MAX_BYTES,
  SUPPORT_IMAGE_MAX_MEGABYTES,
  SUPPORT_MESSAGE_MAX_LENGTH,
  SUPPORT_SUBJECT_MAX_LENGTH,
} from '@/api/support';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { OptionalImageField } from '@/components/ui/optional-image-field';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateSupportMessage } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { base64ByteLength, PickedImage, pickImages } from '@/lib/image-picker';
import { spacing } from '@/theme/tokens';

interface SupportFormSheetProps {
  visible: boolean;
  onClose: () => void;
}

type FieldErrors = Partial<Record<'subject' | 'message' | 'image' | 'api', string>>;

export function SupportFormSheet({ visible, onClose }: SupportFormSheetProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createMutation = useCreateSupportMessage();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (visible) {
      setSubject('');
      setMessage('');
      setImage(null);
      setErrors({});
    }
  }, [visible]);

  const pickImage = async () => {
    const [picked] = await pickImages({ limit: 1 });
    if (picked) {
      setImage(picked);
      setErrors((current) => ({ ...current, image: undefined }));
    }
  };

  const submit = async () => {
    const nextErrors: FieldErrors = {};
    if (!subject.trim()) {
      nextErrors.subject = t('common.requiredField');
    }
    if (!message.trim()) {
      nextErrors.message = t('common.requiredField');
    }
    if (image && base64ByteLength(image.base64) > SUPPORT_IMAGE_MAX_BYTES) {
      nextErrors.image = t('support.imageTooLarge', { max: formatNumber(SUPPORT_IMAGE_MAX_MEGABYTES, locale) });
    }
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.message || nextErrors.image) {
      return;
    }
    try {
      await createMutation.mutateAsync({ subject: subject.trim(), message: message.trim(), image: image?.base64 });
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
        <OptionalImageField
          label={t('support.image')}
          addLabel={t('support.addImage')}
          removeLabel={t('support.removeImage')}
          image={image}
          error={errors.image}
          onPick={() => void pickImage()}
          onRemove={() => setImage(null)}
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
