import type { SearchBarProps } from 'react-native-screens';
import { useI18n } from '@/i18n/i18n-context';

interface HeaderSearchBarConfig {
  placeholder: string;
  onSearch: (text: string) => void;
  hideWhenScrolling?: boolean;
}

export function useHeaderSearchBarOptions({
  placeholder,
  onSearch,
  hideWhenScrolling,
}: HeaderSearchBarConfig): SearchBarProps {
  const { t } = useI18n();
  return {
    placeholder,
    cancelButtonText: t('common.cancel'),
    autoCapitalize: 'none',
    hideWhenScrolling,
    allowToolbarIntegration: false,
    onChangeText: (event) => onSearch(event.nativeEvent.text),
  };
}
