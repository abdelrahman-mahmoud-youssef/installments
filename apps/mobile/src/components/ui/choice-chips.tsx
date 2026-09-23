import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface ChoiceChipsProps<T extends string> {
  options: ChoiceOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}

export function ChoiceChips<T extends string>({ options, selected, onSelect }: ChoiceChipsProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        const accent = option.color ?? colors.primary;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              borderWidth: 1.5,
              borderColor: isSelected ? accent : colors.border,
              backgroundColor: isSelected ? `${accent}14` : colors.surface,
              borderRadius: radius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            {option.icon ? <Ionicons name={option.icon} size={14} color={accent} /> : null}
            <AppText variant="caption" style={{ color: isSelected ? accent : colors.text }}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}
