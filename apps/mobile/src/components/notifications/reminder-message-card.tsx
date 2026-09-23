import { View } from 'react-native';
import { ReminderMessageToggles } from '@/api/notification-settings';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SwitchRow } from '@/components/ui/switch-row';
import { useUpdateReminderMessageToggles } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { useSettingFeedback } from './use-setting-feedback';

const REMINDER_TOGGLE_KEYS: (keyof ReminderMessageToggles)[] = [
  'showProgress',
  'showRemaining',
  'showLocation',
  'showPayLink',
];

interface ReminderMessageCardProps {
  toggles: ReminderMessageToggles;
}

export function ReminderMessageCard({ toggles }: ReminderMessageCardProps) {
  const { t } = useI18n();
  const feedback = useSettingFeedback();
  const updateMutation = useUpdateReminderMessageToggles();

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ gap: 2 }}>
          <AppText variant="bodyStrong">{t('notifications.reminderMessageTitle')}</AppText>
          <AppText variant="caption" tone="muted">
            {t('notifications.reminderMessageDescription')}
          </AppText>
        </View>
        {REMINDER_TOGGLE_KEYS.map((toggleKey) => (
          <SwitchRow
            key={toggleKey}
            label={t(`notifications.${toggleKey}`)}
            value={toggles[toggleKey]}
            disabled={updateMutation.isPending}
            onValueChange={(isEnabled) => updateMutation.mutate({ [toggleKey]: isEnabled }, feedback)}
          />
        ))}
      </View>
    </Card>
  );
}
