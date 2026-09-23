import { useState } from 'react';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/ui/toast-context';
import { useDisconnectTelegram, useSaveTelegramBotToken, useSendTelegramTestMessage } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';

export function useTelegramConnection() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const saveTokenMutation = useSaveTelegramBotToken();
  const testMutation = useSendTelegramTestMessage();
  const disconnectMutation = useDisconnectTelegram();
  const [error, setError] = useState<string | null>(null);

  const describeError = (caught: unknown) => (caught instanceof ApiError ? caught.message : t('common.genericError'));

  const sendTest = async () => {
    setError(null);
    try {
      await testMutation.mutateAsync();
      showToast(t('notifications.testSent'));
    } catch (caught) {
      setError(describeError(caught));
    }
  };

  const connect = async (token: string) => {
    setError(null);
    try {
      await saveTokenMutation.mutateAsync(token);
    } catch (caught) {
      setError(describeError(caught));
      return;
    }
    await sendTest();
  };

  const disconnect = async () => {
    setError(null);
    try {
      await disconnectMutation.mutateAsync();
      showToast(t('notifications.disconnected'));
    } catch (caught) {
      showToast(describeError(caught), 'error');
    }
  };

  return {
    error,
    isConnecting: saveTokenMutation.isPending || testMutation.isPending,
    isTesting: testMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connect,
    sendTest,
    disconnect,
  };
}
