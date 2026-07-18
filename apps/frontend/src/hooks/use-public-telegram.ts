import { useMutation } from '@tanstack/react-query';
import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import {
  disconnectPublicTelegram,
  setPublicTelegramBroadcasts,
  setPublicTelegramEnabled,
  setPublicTelegramLanguage,
  verifyPublicTelegram,
} from '@/lib/api/public';

export function useVerifyPublicTelegram(publicId: string) {
  return useMutation({ mutationFn: () => verifyPublicTelegram(publicId) });
}

export function useSetPublicTelegramEnabled(publicId: string) {
  return useMutation({ mutationFn: (enabled: boolean) => setPublicTelegramEnabled(publicId, enabled) });
}

export function useSetPublicTelegramBroadcasts(publicId: string) {
  return useMutation({ mutationFn: (enabled: boolean) => setPublicTelegramBroadcasts(publicId, enabled) });
}

export function useSetPublicTelegramLanguage(publicId: string) {
  return useMutation({
    mutationFn: (language: NotificationLanguage) => setPublicTelegramLanguage(publicId, language),
  });
}

export function useDisconnectPublicTelegram(publicId: string) {
  return useMutation({ mutationFn: () => disconnectPublicTelegram(publicId) });
}
