import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Announcement, AnnouncementStatus } from '@/api/announcements';
import { AppText } from '@/components/ui/app-text';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

const STATUS_TONES: Record<AnnouncementStatus, BadgeTone> = {
  QUEUED: 'neutral',
  SENDING: 'info',
  DONE: 'success',
};

const BODY_PREVIEW_LINES = 4;

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { t, locale } = useI18n();
  const { colors, fontSize } = useTheme();
  const { counts } = announcement;

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="label" tone="faint">
              {formatDateTime(announcement.createdAt, locale)}
            </AppText>
          </View>
          <Badge label={t(`announcements.status.${announcement.status}`)} tone={STATUS_TONES[announcement.status]} />
        </View>
        {announcement.body ? (
          <AppText numberOfLines={BODY_PREVIEW_LINES}>{announcement.body}</AppText>
        ) : (
          <AppText tone="muted">{t('announcements.imageOnly')}</AppText>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
          {announcement.hasImage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="image-outline" size={fontSize('sm')} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                {t('announcements.withImage')}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" tone="muted">
            {t('announcements.sentCount', {
              sent: formatNumber(counts.sent, locale),
              total: formatNumber(counts.total, locale),
            })}
          </AppText>
          {counts.failed > 0 ? (
            <AppText variant="caption" tone="danger">
              {t('announcements.failedCount', { count: formatNumber(counts.failed, locale) })}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
