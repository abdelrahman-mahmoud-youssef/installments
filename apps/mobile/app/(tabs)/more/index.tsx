import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useDashboard, useSupportMessages } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { countUnseenReplies } from '@/lib/support-replies';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function MoreScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const pendingClaimCount = useDashboard().data?.pendingPaymentClaims ?? 0;
  const supportMessages = useSupportMessages();
  const unseenReplies = countUnseenReplies(supportMessages.data ?? []);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
    >
      <Stack.Screen options={{ title: t('more.title') }} />
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
              <ListRow
                icon="pricetags-outline"
                title={t('more.offers')}
                onPress={() => router.push('/offers')}
                showChevron
              />
              <ListRow
                icon="storefront-outline"
                title={t('more.shop')}
                onPress={() => router.push('/shop')}
                showChevron
              />
            </Card>
          </View>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('more.collectionsSection')} />
          <Card>
            <ListRow
              icon="receipt-outline"
              title={t('more.paymentClaims')}
              onPress={() => router.push('/payment-claims')}
              trailing={
                pendingClaimCount > 0 ? (
                  <Badge label={formatNumber(pendingClaimCount, locale)} tone="warning" />
                ) : undefined
              }
              showChevron
            />
            <ListRow
              icon="bar-chart-outline"
              title={t('more.reports')}
              onPress={() => router.push('/reports')}
              showChevron
            />
          </Card>
        </View>

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

        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('more.helpSection')} />
          <Card>
            <ListRow
              icon="chatbubbles-outline"
              title={t('more.support')}
              onPress={() => router.push('/support')}
              trailing={
                unseenReplies > 0 ? <Badge label={formatNumber(unseenReplies, locale)} tone="danger" /> : undefined
              }
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
