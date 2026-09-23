import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { ChangePasswordSheet } from '@/components/security/change-password-sheet';
import { TwoFactorDisableSheet } from '@/components/security/two-factor-disable-sheet';
import { TwoFactorSetupSheet } from '@/components/security/two-factor-setup-sheet';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type SecuritySheet = 'changePassword' | 'enableTwoFactor' | 'disableTwoFactor';

export default function SecurityScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [openSheet, setOpenSheet] = useState<SecuritySheet | null>(null);
  const isTwoFactorEnabled = user?.twoFactorEnabled ?? false;
  const closeSheet = () => setOpenSheet(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('security.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl }}
      >
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('security.passwordSection')} />
          <Card>
            <ListRow
              icon="key-outline"
              title={t('security.changePassword')}
              onPress={() => setOpenSheet('changePassword')}
              showChevron
            />
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('security.twoFactorSection')} />
          <Card>
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                  {t('security.twoFactorDescription')}
                </AppText>
                <Badge
                  label={isTwoFactorEnabled ? t('security.twoFactorOn') : t('security.twoFactorOff')}
                  tone={isTwoFactorEnabled ? 'success' : 'neutral'}
                />
              </View>
              {isTwoFactorEnabled ? (
                <Button
                  title={t('security.disableTwoFactor')}
                  icon="shield-outline"
                  variant="destructive"
                  onPress={() => setOpenSheet('disableTwoFactor')}
                />
              ) : (
                <Button
                  title={t('security.enableTwoFactor')}
                  icon="shield-checkmark-outline"
                  onPress={() => setOpenSheet('enableTwoFactor')}
                />
              )}
            </View>
          </Card>
        </View>
      </ScrollView>

      <ChangePasswordSheet visible={openSheet === 'changePassword'} onClose={closeSheet} />
      <TwoFactorSetupSheet visible={openSheet === 'enableTwoFactor'} onClose={closeSheet} />
      <TwoFactorDisableSheet visible={openSheet === 'disableTwoFactor'} onClose={closeSheet} />
    </View>
  );
}
