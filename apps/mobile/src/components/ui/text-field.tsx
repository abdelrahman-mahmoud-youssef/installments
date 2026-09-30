import { forwardRef, useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  secureToggle?: boolean;
  ltr?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, optional = false, secureToggle = false, ltr, style, multiline, secureTextEntry, ...rest },
  ref,
) {
  const { colors, fontSize } = useTheme();
  const { t, isRTL } = useI18n();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.primary : colors.border;
  const forceLtr =
    ltr ??
    (rest.keyboardType === 'email-address' || rest.keyboardType === 'url' || rest.keyboardType === 'phone-pad');

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
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={secureToggle ? !isPasswordVisible : secureTextEntry}
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
              paddingStart: spacing.lg,
              paddingEnd: secureToggle ? touchTarget.minHeight : spacing.lg,
              paddingVertical: spacing.md,
              minHeight: multiline ? 96 : touchTarget.minHeight + 4,
              textAlignVertical: multiline ? 'top' : 'center',
              textAlign: forceLtr || !isRTL ? 'left' : 'right',
              writingDirection: forceLtr ? 'ltr' : undefined,
            },
            style,
          ]}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setIsPasswordVisible((current) => !current)}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? t('common.hidePassword') : t('common.showPassword')}
            style={{
              position: 'absolute',
              end: spacing.sm,
              width: touchTarget.minHeight - spacing.sm,
              height: touchTarget.minHeight - spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
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
