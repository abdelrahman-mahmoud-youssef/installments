import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { PressableScale } from './pressable-scale';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { colors, fontSize } = useTheme();
  const { isRTL } = useI18n();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        minHeight: touchTarget.minHeight,
      }}
    >
      <Ionicons name="search" size={18} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoCorrect={false}
        returnKeyType="search"
        style={{
          flex: 1,
          color: colors.text,
          fontSize: fontSize('md'),
          paddingVertical: spacing.sm,
          textAlign: isRTL ? 'right' : 'left',
        }}
      />
      {value.length > 0 ? (
        <PressableScale onPress={() => onChangeText('')} accessibilityRole="button" hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textFaint} />
        </PressableScale>
      ) : null}
    </View>
  );
}
