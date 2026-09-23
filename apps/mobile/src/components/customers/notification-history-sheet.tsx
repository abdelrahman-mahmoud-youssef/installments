import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerNotification } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useCustomerNotifications } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

const CHANNEL_ICONS: Record<CustomerNotification['channel'], keyof typeof Ionicons.glyphMap> = {
  TELEGRAM: 'paper-plane-outline',
  WHATSAPP: 'logo-whatsapp',
};

interface NotificationHistorySheetProps {
  visible: boolean;
  customerId: string;
  onClose: () => void;
}

export function NotificationHistorySheet({ visible, customerId, onClose }: NotificationHistorySheetProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const query = useCustomerNotifications(customerId, visible);
  const notifications = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('customerActions.notificationHistory')}>
      {query.isPending ? (
        <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.xxl }} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : notifications.length === 0 ? (
        <AppText variant="caption" tone="muted" align="center">
          {t('customerActions.noNotifications')}
        </AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          {notifications.map((notification, index) => (
            <View
              key={notification.id}
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                paddingBottom: spacing.md,
                borderBottomWidth: index === notifications.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <Ionicons name={CHANNEL_ICONS[notification.channel]} size={20} color={colors.textMuted} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                  <AppText variant="caption" tone="muted">
                    {t(`customerActions.notificationType.${notification.type}`)}
                  </AppText>
                  <Badge
                    label={notification.success ? t('customerActions.delivered') : t('customerActions.failed')}
                    tone={notification.success ? 'success' : 'danger'}
                  />
                </View>
                <AppText variant="caption" numberOfLines={3}>
                  {notification.preview}
                </AppText>
                {notification.error ? (
                  <AppText variant="label" tone="danger" numberOfLines={2}>
                    {notification.error}
                  </AppText>
                ) : null}
                <AppText variant="label" tone="faint">
                  {formatDateTime(notification.sentAt, locale)}
                </AppText>
              </View>
            </View>
          ))}
          {query.hasNextPage ? (
            <Button
              title={t('common.loadMore')}
              variant="ghost"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            />
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}
