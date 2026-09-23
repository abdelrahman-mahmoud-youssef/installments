import { View } from 'react-native';
import { NotificationLanguage, NotificationSettings } from '@/api/notification-settings';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SwitchRow } from '@/components/ui/switch-row';
import { useSetNotificationLanguage, useSetTelegramPublicVisibility } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { useSettingFeedback } from './use-setting-feedback';

interface NotificationPreferencesCardProps {
  settings: NotificationSettings;
}

export function NotificationPreferencesCard({ settings }: NotificationPreferencesCardProps) {
  const { t } = useI18n();
  const feedback = useSettingFeedback();
  const languageMutation = useSetNotificationLanguage();
  const visibilityMutation = useSetTelegramPublicVisibility();

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <AppText variant="bodyStrong">{t('notifications.preferencesTitle')}</AppText>
        <View style={{ gap: spacing.sm }}>
          <View style={{ gap: 2 }}>
            <AppText>{t('notifications.languageLabel')}</AppText>
            <AppText variant="caption" tone="muted">
              {t('notifications.languageHint')}
            </AppText>
          </View>
          <SegmentedControl<NotificationLanguage>
            options={[
              { value: 'AR', label: t('settings.arabic') },
              { value: 'EN', label: t('settings.english') },
            ]}
            selected={settings.notificationLanguage}
            onSelect={(language) => {
              if (language !== settings.notificationLanguage && !languageMutation.isPending) {
                languageMutation.mutate(language, feedback);
              }
            }}
          />
        </View>
        <SwitchRow
          label={t('notifications.publicVisibilityLabel')}
          hint={t('notifications.publicVisibilityHint')}
          value={settings.showTelegramOnPublicPage}
          disabled={visibilityMutation.isPending}
          onValueChange={(isVisible) => visibilityMutation.mutate(isVisible, feedback)}
        />
      </View>
    </Card>
  );
}
