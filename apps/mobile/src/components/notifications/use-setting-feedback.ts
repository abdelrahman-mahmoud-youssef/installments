import { useMemo } from 'react';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/toast-context';
import { useI18n } from '@/i18n/i18n-context';

export function useSettingFeedback() {
  const { t } = useI18n();
  const { showToast } = useToast();
  return useMemo(
    () => ({
      onSuccess: () => showToast(t('notifications.settingSaved')),
      onError: (error: Error) =>
        showToast(error instanceof ApiError ? error.message : t('common.genericError'), 'error'),
    }),
    [showToast, t],
  );
}
