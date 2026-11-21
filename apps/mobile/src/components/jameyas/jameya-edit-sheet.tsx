import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { JameyaDetail } from '@/api/jameyas';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useUpdateJameya } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { JAMEYA_NAME_MAX_LENGTH, JAMEYA_NOTE_MAX_LENGTH } from './jameya-limits';

interface JameyaEditSheetProps {
  visible: boolean;
  jameya: JameyaDetail;
  onClose: () => void;
}

export function JameyaEditSheet({ visible, jameya, onClose }: JameyaEditSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const updateJameya = useUpdateJameya(jameya.id);
  const [name, setName] = useState(jameya.name);
  const [notes, setNotes] = useState(jameya.notes ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(jameya.name);
    setNotes(jameya.notes ?? '');
    setNameError(null);
    setApiError(null);
  }, [visible]);

  const submit = async () => {
    const trimmedName = name.trim();
    const message = trimmedName ? null : t('jameyas.validation.nameRequired');
    setNameError(message);
    if (message) {
      return;
    }
    setApiError(null);
    try {
      await updateJameya.mutateAsync({ name: trimmedName, notes: notes.trim() });
      showToast(t('jameyas.editDialog.saved'));
      onClose();
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : t('jameyas.editDialog.saveError'));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={updateJameya.isPending ? () => undefined : onClose}
      title={t('jameyas.editDialog.title')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('jameyas.editDialog.name')}
          value={name}
          onChangeText={setName}
          maxLength={JAMEYA_NAME_MAX_LENGTH}
          error={nameError ?? undefined}
        />
        <TextField
          label={t('jameyas.editDialog.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
          optional
          maxLength={JAMEYA_NOTE_MAX_LENGTH}
          error={apiError ?? undefined}
        />
        <Button
          title={t('jameyas.editDialog.save')}
          onPress={() => void submit()}
          loading={updateJameya.isPending}
        />
      </View>
    </BottomSheet>
  );
}
