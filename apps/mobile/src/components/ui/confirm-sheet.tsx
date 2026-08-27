import { View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmTitle,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { t } = useI18n();
  return (
    <BottomSheet visible={visible} onClose={loading ? () => undefined : onCancel} title={title} scrollable={false}>
      <AppText tone="muted">{message}</AppText>
      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button
          title={confirmTitle}
          onPress={onConfirm}
          variant={destructive ? 'destructive' : 'primary'}
          loading={loading}
        />
        <Button title={t('common.cancel')} onPress={onCancel} variant="secondary" disabled={loading} />
      </View>
    </BottomSheet>
  );
}
