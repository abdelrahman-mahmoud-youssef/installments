import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnnouncementSubscriber } from '@/api/announcements';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';

const CHECKBOX_SIZE = 24;
const DISABLED_OPACITY = 0.5;

interface SubscriberRowProps {
  subscriber: AnnouncementSubscriber;
  selected: boolean;
  onToggle: () => void;
}

export function SubscriberRow({ subscriber, selected, onToggle }: SubscriberRowProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const isOptedOut = !subscriber.telegramBroadcastsEnabled;

  return (
    <PressableScale
      onPress={onToggle}
      disabled={isOptedOut}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: isOptedOut }}
      accessibilityLabel={subscriber.name}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: touchTarget.minHeight + spacing.sm,
        paddingVertical: spacing.xs,
        opacity: isOptedOut ? DISABLED_OPACITY : 1,
      }}
    >
      <Avatar name={subscriber.name} />
      <View style={{ flex: 1 }}>
        <AppText numberOfLines={1}>{subscriber.name}</AppText>
      </View>
      {isOptedOut ? (
        <Badge label={t('announcements.optedOut')} tone="warning" />
      ) : (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={CHECKBOX_SIZE}
          color={selected ? colors.primary : colors.textFaint}
        />
      )}
    </PressableScale>
  );
}
