import type { SearchBarProps } from 'react-native-screens';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';

interface HeaderSearchBarConfig {
  placeholder: string;
  onSearch: (text: string) => void;
}

export function useHeaderSearchBarOptions({ placeholder, onSearch }: HeaderSearchBarConfig): SearchBarProps {
  const { t } = useI18n();
  const { colors } = useTheme();
  return {
    placeholder,
    cancelButtonText: t('common.cancel'),
    autoCapitalize: 'none',
    hideWhenScrolling: false,
    placement: 'stacked',
    allowToolbarIntegration: false,
    barTintColor: colors.surface,
    textColor: colors.text,
    tintColor: colors.primary,
    hintTextColor: colors.textFaint,
    headerIconColor: colors.textMuted,
    onChangeText: (event) => onSearch(event.nativeEvent.text),
  };
}
