import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';

type StackScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack>['screenOptions']>,
  (...args: never[]) => unknown
>;

interface StackScreenOptionsConfig {
  largeTitle?: boolean;
}

const isIOS = Platform.OS === 'ios';

export function useStackScreenOptions({ largeTitle = false }: StackScreenOptionsConfig = {}): StackScreenOptions {
  const { colors } = useTheme();
  const { t } = useI18n();
  const usesSystemGlass = isIOS && isLiquidGlassAvailable();

  return {
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.text },
    headerLargeTitleStyle: { color: colors.text },
    headerBackTitle: t('common.back'),
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    headerLargeTitle: isIOS && largeTitle,
    headerLargeTitleShadowVisible: false,
    headerTransparent: isIOS,
    headerBlurEffect: isIOS && !usesSystemGlass ? 'systemChromeMaterial' : undefined,
    headerStyle: isIOS ? undefined : { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
  };
}
