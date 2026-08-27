import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ListRow } from '@/components/ui/list-row';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function MoreScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [signOutVisible, setSignOutVisible] = useState(false);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
    >
      <ScreenHeader title={t('more.title')} />
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
        {user ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={user.name} size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{user.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {user.email}
                </AppText>
              </View>
              <Badge label={t(`more.role.${user.role}`)} tone={isAdmin ? 'primary' : 'neutral'} />
            </View>
          </Card>
        ) : null}

        {isAdmin ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title={t('more.manageSection')} />
            <Card>
              <ListRow
                icon="people-outline"
                title={t('more.staff')}
                onPress={() => router.push('/staff')}
                showChevron
              />
              <ListRow
                icon="time-outline"
                title={t('more.activity')}
                onPress={() => router.push('/activity')}
                showChevron
              />
            </Card>
          </View>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('more.preferencesSection')} />
          <Card>
            <ListRow
              icon="settings-outline"
              title={t('more.settings')}
              onPress={() => router.push('/settings')}
              showChevron
            />
          </Card>
        </View>

        <Card>
          <ListRow
            icon="log-out-outline"
            title={t('more.signOut')}
            destructive
            onPress={() => setSignOutVisible(true)}
          />
        </Card>
      </View>

      <ConfirmSheet
        visible={signOutVisible}
        title={t('more.signOutTitle')}
        message={t('more.signOutConfirm')}
        confirmTitle={t('more.signOut')}
        destructive
        onConfirm={() => {
          setSignOutVisible(false);
          void signOut();
        }}
        onCancel={() => setSignOutVisible(false)}
      />
    </ScrollView>
  );
}
