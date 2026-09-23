import { useCallback } from 'react';
import { Share } from 'react-native';
import { useToast } from '@/components/ui/toast-context';
import { useI18n } from '@/i18n/i18n-context';

export function useShareText() {
  const { t } = useI18n();
  const { showToast } = useToast();

  return useCallback(
    async (message: string) => {
      try {
        await Share.share({ message });
      } catch {
        showToast(t('common.genericError'), 'error');
      }
    },
    [showToast, t],
  );
}
