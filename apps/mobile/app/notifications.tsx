import { Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { NotificationPreferencesCard } from '@/components/notifications/notification-preferences-card';
import { ReminderMessageCard } from '@/components/notifications/reminder-message-card';
import { TelegramConnectedCard } from '@/components/notifications/telegram-connected-card';
import { TelegramSetupCard } from '@/components/notifications/telegram-setup-card';
import { useTelegramConnection } from '@/components/notifications/use-telegram-connection';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useNotificationSettings } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { data, isPending, isError, error, refetch, isRefetching } = useNotificationSettings(isAdmin);
  const telegram = useTelegramConnection();
  const [disconnectVisible, setDisconnectVisible] = useState(false);

  const renderContent = () => {
    if (!isAdmin) {
      return (
        <Card>
          <AppText variant="caption" tone="muted">
            {t('notifications.adminOnly')}
          </AppText>
        </Card>
      );
    }
    if (isPending) {
      return <SkeletonCardList count={3} rows={3} />;
    }
    if (isError || !data) {
      return <ErrorState error={error} onRetry={() => void refetch()} />;
    }
    return (
      <>
        {data.telegramConfigured ? (
          <TelegramConnectedCard
            chatId={data.telegramChatId}
            testing={telegram.isTesting}
            error={telegram.error}
            onSendTest={() => void telegram.sendTest()}
            onDisconnect={() => setDisconnectVisible(true)}
          />
        ) : (
          <TelegramSetupCard
            connecting={telegram.isConnecting}
            error={telegram.error}
            onConnect={(token) => void telegram.connect(token)}
          />
        )}
        <NotificationPreferencesCard settings={data} />
        <ReminderMessageCard toggles={data.reminderMessage} />
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('notifications.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl }}
        refreshControl={
          isAdmin ? (
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
          ) : undefined
        }
      >
        <AppText variant="caption" tone="muted">
          {t('notifications.description')}
        </AppText>
        {renderContent()}
      </ScrollView>

      <ConfirmSheet
        visible={disconnectVisible}
        title={t('notifications.disconnectTitle')}
        message={t('notifications.disconnectConfirm')}
        confirmTitle={t('notifications.disconnect')}
        destructive
        loading={telegram.isDisconnecting}
        onConfirm={() => void telegram.disconnect().finally(() => setDisconnectVisible(false))}
        onCancel={() => setDisconnectVisible(false)}
      />
    </View>
  );
}
