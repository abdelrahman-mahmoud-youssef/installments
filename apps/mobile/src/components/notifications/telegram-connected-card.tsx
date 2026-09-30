import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { isolateLtr } from '@/lib/format';

interface TelegramConnectedCardProps {
  chatId: string | null;
  testing: boolean;
  error: string | null;
  onSendTest: () => void;
  onDisconnect: () => void;
}

export function TelegramConnectedCard({ chatId, testing, error, onSendTest, onDisconnect }: TelegramConnectedCardProps) {
  const { t } = useI18n();
  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <Badge
          label={chatId ? t('notifications.connected') : t('notifications.awaitingChat')}
          tone={chatId ? 'success' : 'warning'}
        />
        <AppText variant="caption" tone="muted">
          {chatId ? t('notifications.connectedChat', { chatId: isolateLtr(chatId) }) : t('notifications.awaitingChatHint')}
        </AppText>
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        <Button
          title={t('notifications.sendTest')}
          icon="paper-plane-outline"
          variant="secondary"
          onPress={onSendTest}
          loading={testing}
        />
        <Button
          title={t('notifications.disconnect')}
          icon="unlink-outline"
          variant="destructive"
          onPress={onDisconnect}
          disabled={testing}
        />
      </View>
    </Card>
  );
}
