import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useShareText } from '@/hooks/use-share-text';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { MonospaceBlock } from './monospace-block';

interface BackupCodesStepProps {
  backupCodes: string[];
  finishing: boolean;
  onDone: () => void;
}

export function BackupCodesStep({ backupCodes, finishing, onDone }: BackupCodesStepProps) {
  const { t } = useI18n();
  const shareText = useShareText();

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('security.backupCodesDescription')}
      </AppText>
      <MonospaceBlock lines={backupCodes} />
      <Button
        title={t('security.shareBackupCodes')}
        icon="share-outline"
        variant="secondary"
        onPress={() => void shareText(backupCodes.join('\n'))}
      />
      <Button title={t('security.done')} onPress={onDone} loading={finishing} />
    </View>
  );
}
