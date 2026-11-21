import { InputAccessoryView, Keyboard, Platform, View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

export const KEYBOARD_DONE_BAR_ID = 'keyboard-done-bar';

export function KeyboardDoneBar() {
  const { t, direction } = useI18n();
  const { colors } = useTheme();
  if (Platform.OS !== 'ios') {
    return null;
  }
  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_BAR_ID}>
      <View
        style={{
          direction,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surfaceMuted,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <PressableScale onPress={() => Keyboard.dismiss()} accessibilityRole="button" hitSlop={spacing.sm}>
          <AppText variant="bodyStrong" tone="primary">
            {t('common.done')}
          </AppText>
        </PressableScale>
      </View>
    </InputAccessoryView>
  );
}
