import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { selectionHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  activeColor?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, selected, onSelect }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        padding: spacing.xs,
        gap: spacing.xs,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        const foreground = isSelected ? (option.activeColor ?? colors.text) : colors.textMuted;
        return (
          <PressableScale
            key={option.value}
            onPress={() => {
              selectionHaptic();
              onSelect(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              minHeight: touchTarget.minHeight - spacing.sm,
              borderRadius: radius.sm,
              backgroundColor: isSelected ? colors.surface : 'transparent',
              shadowColor: colors.text,
              shadowOpacity: isSelected ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: isSelected ? 1 : 0,
            }}
          >
            {option.icon ? <Ionicons name={option.icon} size={16} color={foreground} /> : null}
            <AppText variant="caption" style={{ color: foreground, fontWeight: isSelected ? '600' : '500' }}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}
