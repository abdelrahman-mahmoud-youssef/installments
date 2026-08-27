import { ScrollView } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({ options, selected, onSelect }: FilterChipsProps<T>) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={{
              backgroundColor: isSelected ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: isSelected ? colors.text : colors.border,
              borderRadius: radius.full,
              paddingHorizontal: spacing.lg,
              minHeight: touchTarget.minHeight - 8,
              justifyContent: 'center',
            }}
          >
            <AppText variant="caption" style={{ color: isSelected ? colors.background : colors.textMuted }}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
