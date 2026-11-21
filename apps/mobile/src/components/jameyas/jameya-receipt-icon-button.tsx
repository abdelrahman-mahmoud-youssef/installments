import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export function JameyaReceiptIconButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t('jameyas.receipt.download')}
      accessibilityState={{ disabled }}
      hitSlop={spacing.sm}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name="document-text-outline" size={22} color={colors.primary} />
    </PressableScale>
  );
}
