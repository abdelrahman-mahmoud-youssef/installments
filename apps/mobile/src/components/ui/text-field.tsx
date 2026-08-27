import { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, optional = false, style, multiline, ...rest },
  ref,
) {
  const { colors, fontSize } = useTheme();
  const { t, isRTL } = useI18n();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.primary : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'baseline' }}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        {optional ? (
          <AppText variant="label" tone="faint">
            {t('common.optional')}
          </AppText>
        ) : null}
      </View>
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        onFocus={(event) => {
          setIsFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          rest.onBlur?.(event);
        }}
        placeholderTextColor={colors.textFaint}
        style={[
          {
            borderWidth: 1.5,
            borderColor,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: fontSize('md'),
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            minHeight: multiline ? 96 : touchTarget.minHeight + 4,
            textAlignVertical: multiline ? 'top' : 'center',
            textAlign: isRTL ? 'right' : 'left',
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});
