import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/theme/theme-context';
import { fontFamilies, radius, spacing } from '@/theme/tokens';

interface MonospaceBlockProps {
  lines: string[];
}

export function MonospaceBlock({ lines }: MonospaceBlockProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
        gap: spacing.xs,
      }}
    >
      {lines.map((line) => (
        <AppText
          key={line}
          selectable
          style={{ fontFamily: fontFamilies.monospace, textAlign: 'left', writingDirection: 'ltr' }}
        >
          {line}
        </AppText>
      ))}
    </View>
  );
}
