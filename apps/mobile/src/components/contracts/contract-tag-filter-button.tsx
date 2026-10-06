import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, touchTarget } from '@/theme/tokens';

const ICON_SIZE = 18;
const BUTTON_SIZE = touchTarget.minHeight - 8;

interface ContractTagFilterButtonProps {
  isFiltering: boolean;
  onPress: () => void;
}

export function ContractTagFilterButton({ isFiltering, onPress }: ContractTagFilterButtonProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('contracts.filterByTag')}
      accessibilityState={{ selected: isFiltering }}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: isFiltering ? colors.text : colors.border,
        backgroundColor: isFiltering ? colors.text : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={isFiltering ? 'funnel' : 'funnel-outline'}
        size={ICON_SIZE}
        color={isFiltering ? colors.background : colors.textMuted}
      />
    </PressableScale>
  );
}
