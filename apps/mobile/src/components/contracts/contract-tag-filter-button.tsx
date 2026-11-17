import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '@/components/ui/glass-surface';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, touchTarget } from '@/theme/tokens';

const BUTTON_SIZE = touchTarget.minHeight + 4;

interface ContractTagFilterButtonProps {
  isFiltering: boolean;
  onPress: () => void;
}

export function ContractTagFilterButton({ isFiltering, onPress }: ContractTagFilterButtonProps) {
  const { t } = useI18n();
  const { colors, fontSize } = useTheme();
  const surfaceColor = isFiltering ? colors.primary : colors.surface;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('contracts.filterByTag')}
      accessibilityState={{ selected: isFiltering }}
    >
      <GlassSurface
        tint={isFiltering ? colors.primary : undefined}
        interactive
        elevated
        fallbackColor={surfaceColor}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={isFiltering ? 'funnel' : 'funnel-outline'}
          size={fontSize('lg')}
          color={isFiltering ? colors.onPrimary : colors.text}
        />
      </GlassSurface>
    </PressableScale>
  );
}
