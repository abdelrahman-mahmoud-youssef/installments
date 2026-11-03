import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useToast } from '@/components/ui/toast-context';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const SUPPORT_SEGMENT = 'support';
const CONTENT_MAX_WIDTH = 420;

export function SubscriptionGate() {
  const { isSubscriptionExpired, isAdmin, refreshUser, signOut } = useAuth();
  const { t, direction } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);

  if (!isSubscriptionExpired || segments[0] === SUPPORT_SEGMENT) {
    return null;
  }

  async function handleCheckAgain() {
    setIsChecking(true);
    try {
      await refreshUser();
    } catch {
      showToast(t('common.genericError'), 'error');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { direction, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, padding: spacing.xl, gap: spacing.lg }}>
        <View
          style={{
            alignSelf: 'center',
            width: 64,
            height: 64,
            borderRadius: radius.full,
            backgroundColor: colors.warningMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed-outline" size={30} color={colors.warning} />
        </View>
        <AppText variant="title" align="center">
          {t('subscription.title')}
        </AppText>
        <AppText tone="muted" align="center">
          {isAdmin ? t('subscription.adminMessage') : t('subscription.staffMessage')}
        </AppText>
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {isAdmin && (
            <Button
              title={t('subscription.contactSupport')}
              icon="chatbubble-ellipses-outline"
              onPress={() => router.push('/support')}
            />
          )}
          <Button
            title={t('subscription.checkAgain')}
            icon="refresh"
            variant="secondary"
            loading={isChecking}
            onPress={handleCheckAgain}
          />
          <Button title={t('more.signOut')} variant="ghost" onPress={() => setSignOutVisible(true)} />
        </View>
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
    </View>
  );
}
