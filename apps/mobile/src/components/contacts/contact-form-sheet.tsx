import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { Counterparty, SaveCounterpartyInput } from '@/api/counterparties';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { PickedImage, pickImages } from '@/lib/image-picker';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const PHOTO_SIZE = 88;
const PHOTO_BADGE_SIZE = 30;

interface ContactFormSheetProps {
  visible: boolean;
  contact: Counterparty | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: SaveCounterpartyInput) => Promise<void>;
}

export function ContactFormSheet({ visible, contact, saving, onClose, onSubmit }: ContactFormSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [errors, setErrors] = useState<{ name?: string; api?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(contact?.name ?? '');
    setPhone(contact?.phone ?? '');
    setNotes(contact?.notes ?? '');
    setPhoto(null);
    setErrors({});
  }, [visible, contact]);

  const choosePhoto = async () => {
    const [picked] = await pickImages({ limit: 1, square: true });
    if (picked) {
      setPhoto(picked);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setErrors({ name: t('common.requiredField') });
      return;
    }
    setErrors({});
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        photo: photo?.base64,
      });
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={contact ? t('contacts.editContact') : t('contacts.newContact')}
    >
      <View style={{ gap: spacing.lg }}>
        <PressableScale
          onPress={() => void choosePhoto()}
          accessibilityRole="button"
          accessibilityLabel={t('contacts.choosePhoto')}
          style={{ alignSelf: 'center' }}
        >
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.full }}
            />
          ) : (
            <Avatar name={name || '?'} photoUrl={contact?.photoUrl} size={PHOTO_SIZE} />
          )}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              end: 0,
              width: PHOTO_BADGE_SIZE,
              height: PHOTO_BADGE_SIZE,
              borderRadius: radius.full,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={14} color={colors.onPrimary} />
          </View>
        </PressableScale>

        <TextField label={t('contacts.name')} value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label={t('contacts.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          optional
        />
        <TextField label={t('contacts.notes')} value={notes} onChangeText={setNotes} multiline optional />
        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void submit()} loading={saving} />
      </View>
    </BottomSheet>
  );
}
