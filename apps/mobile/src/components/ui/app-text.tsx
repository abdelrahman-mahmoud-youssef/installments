import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { FontSizeToken } from '@/theme/tokens';

type Variant = 'largeTitle' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label';
type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'danger' | 'success' | 'warning' | 'inverse';

const VARIANT_STYLES: Record<Variant, { size: FontSizeToken; weight: TextStyle['fontWeight'] }> = {
  largeTitle: { size: 'xxxl', weight: '700' },
  title: { size: 'xxl', weight: '700' },
  heading: { size: 'lg', weight: '600' },
  body: { size: 'md', weight: '400' },
  bodyStrong: { size: 'md', weight: '600' },
  caption: { size: 'sm', weight: '400' },
  label: { size: 'xs', weight: '500' },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
}

export function AppText({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const { colors, fontSize } = useTheme();
  const { size, weight } = VARIANT_STYLES[variant];
  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    faint: colors.textFaint,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
    warning: colors.warning,
    inverse: colors.onPrimary,
  };
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[
        {
          fontSize: fontSize(size),
          fontWeight: weight,
          color: toneColor[tone],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
