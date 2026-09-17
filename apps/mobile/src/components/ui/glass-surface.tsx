import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/theme-context';

interface GlassSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  interactive?: boolean;
  elevated?: boolean;
  fallbackColor?: string;
}

const FALLBACK_ELEVATION: ViewStyle = {
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

export function GlassSurface({
  children,
  style,
  tint,
  interactive = false,
  elevated = false,
  fallbackColor,
}: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();

  if (!isLiquidGlassAvailable()) {
    return (
      <View
        style={[
          { backgroundColor: fallbackColor ?? colors.surface },
          elevated ? FALLBACK_ELEVATION : null,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <GlassView
      glassEffectStyle="regular"
      tintColor={tint}
      isInteractive={interactive}
      colorScheme={isDark ? 'dark' : 'light'}
      style={style}
    >
      {children}
    </GlassView>
  );
}
