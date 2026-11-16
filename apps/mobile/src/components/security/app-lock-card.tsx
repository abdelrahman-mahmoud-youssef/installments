import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SwitchRow } from '@/components/ui/switch-row';
import { useI18n } from '@/i18n/i18n-context';
import { useAppLock } from '@/security/app-lock-context';
import { spacing } from '@/theme/tokens';

export function AppLockCard() {
  const { t } = useI18n();
  const { isAvailable, isPreferenceEnabled, setPreferenceEnabled } = useAppLock();
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await setPreferenceEnabled(enabled);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <SwitchRow
          label={t('security.appLockLabel')}
          hint={t('security.appLockHint')}
          value={isAvailable && isPreferenceEnabled}
          disabled={!isAvailable || isSaving}
          onValueChange={(enabled) => void handleChange(enabled)}
        />
        {!isAvailable ? (
          <AppText variant="caption" tone="muted">
            {t('security.appLockUnavailable')}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}
