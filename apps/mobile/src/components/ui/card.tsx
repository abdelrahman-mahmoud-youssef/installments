import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
