import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { BRAND_COLOR_HEX, BRAND_COLOR_PRESETS, BrandColorPreset } from '@/lib/brand-colors';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface BrandColorPickerProps {
  selected: BrandColorPreset;
  labels: Record<BrandColorPreset, string>;
  disabled?: boolean;
  onSelect: (preset: BrandColorPreset) => void;
}

const SWATCH_SIZE = 40;
const RING_WIDTH = 3;

export function BrandColorPicker({ selected, labels, disabled = false, onSelect }: BrandColorPickerProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs }}
    >
      {BRAND_COLOR_PRESETS.map((preset) => {
        const isSelected = preset === selected;
        const hex = BRAND_COLOR_HEX[preset];
        return (
          <PressableScale
            key={preset}
            onPress={() => onSelect(preset)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={labels[preset]}
            accessibilityState={{ selected: isSelected, disabled }}
            style={{
              width: SWATCH_SIZE + RING_WIDTH * 4,
              height: SWATCH_SIZE + RING_WIDTH * 4,
              borderRadius: radius.full,
              borderWidth: RING_WIDTH,
              borderColor: isSelected ? hex : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: radius.full,
                backgroundColor: hex,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected ? <Ionicons name="checkmark" size={20} color={colors.surface} /> : null}
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
