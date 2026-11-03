import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export function SubscriptionRenewalCard() {
  const { user, isAdmin } = useAuth();
  const { t, locale, isRTL } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();

  if (!user?.subscription.isRenewalDueSoon) {
    return null;
  }

  const { subscription } = user;
  const date = formatDate(subscription.expiresOn, locale);
  const title = subscription.status === 'TRIAL' ? t('subscription.trialEndingTitle') : t('subscription.endingTitle');

  const content = (
    <Card style={{ backgroundColor: colors.warningMuted, borderColor: colors.warningMuted }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons name="calendar-outline" size={22} color={colors.warning} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" tone="warning">
            {title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isAdmin ? t('subscription.endingAdminMessage', { date }) : t('subscription.endingStaffMessage', { date })}
          </AppText>
        </View>
        {isAdmin ? (
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.warning} />
        ) : null}
      </View>
    </Card>
  );

  if (!isAdmin) {
    return content;
  }

  return (
    <PressableScale onPress={() => router.push('/support')} accessibilityRole="button">
      {content}
    </PressableScale>
  );
}
