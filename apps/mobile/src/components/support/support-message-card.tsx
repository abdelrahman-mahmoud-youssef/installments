import { View } from 'react-native';
import { SupportMessage } from '@/api/support';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface SupportMessageCardProps {
  message: SupportMessage;
}

export function SupportMessageCard({ message }: SupportMessageCardProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const hasReply = message.adminReply !== null;

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">{message.subject}</AppText>
            <AppText variant="label" tone="faint">
              {formatDateTime(message.createdAt, locale)}
            </AppText>
          </View>
          <Badge
            label={hasReply ? t('support.replied') : t('support.awaitingReply')}
            tone={hasReply ? 'success' : 'neutral'}
          />
        </View>
        <AppText tone="muted">{message.message}</AppText>
        {hasReply ? (
          <View
            style={{
              gap: spacing.xs,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.primaryMuted,
            }}
          >
            <AppText variant="caption" tone="primary" style={{ fontWeight: '600' }}>
              {t('support.reply')}
            </AppText>
            <AppText>{message.adminReply}</AppText>
            {message.repliedAt ? (
              <AppText variant="label" tone="faint">
                {formatDateTime(message.repliedAt, locale)}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
