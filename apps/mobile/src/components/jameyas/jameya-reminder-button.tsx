import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { JameyaMember } from '@/api/jameyas';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { whatsappChatUrl } from '@/lib/phone';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export function JameyaReminderButton({ member }: { member: Pick<JameyaMember, 'name' | 'phone' | 'reminderMessage'> }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  if (!member.reminderMessage) {
    return null;
  }
  const message = member.reminderMessage;
  return (
    <PressableScale
      onPress={() => void Linking.openURL(whatsappChatUrl(member.phone, message))}
      accessibilityRole="link"
      accessibilityLabel={t('jameyas.grid.sendReminder', { name: member.name })}
      hitSlop={spacing.sm}
    >
      <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
    </PressableScale>
  );
}
