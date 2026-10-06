import { Stack } from 'expo-router';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { HeaderTitle } from '@/components/ui/header-title';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';

type StackScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack>['screenOptions']>,
  (...args: never[]) => unknown
>;

const isIOS = Platform.OS === 'ios';

export function useStackScreenOptions(): StackScreenOptions {
  const { colors } = useTheme();
  const { t, direction } = useI18n();
  return {
    headerTintColor: colors.primary,
    headerTitle: ({ children }) => <HeaderTitle title={children} />,
    headerBackTitle: t('common.back'),
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    headerTransparent: isIOS,
    headerBlurEffect: isIOS ? 'systemChromeMaterial' : undefined,
    headerStyle: isIOS ? undefined : { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background, direction },
  };
}
