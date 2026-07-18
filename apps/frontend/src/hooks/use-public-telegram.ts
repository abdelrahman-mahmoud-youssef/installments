import { useMutation } from '@tanstack/react-query';
import {
  disconnectPublicTelegram,
  setPublicTelegramEnabled,
  verifyPublicTelegram,
} from '@/lib/api/public';

export function useVerifyPublicTelegram(publicId: string) {
  return useMutation({ mutationFn: () => verifyPublicTelegram(publicId) });
}

export function useSetPublicTelegramEnabled(publicId: string) {
  return useMutation({ mutationFn: (enabled: boolean) => setPublicTelegramEnabled(publicId, enabled) });
}

export function useDisconnectPublicTelegram(publicId: string) {
  return useMutation({ mutationFn: () => disconnectPublicTelegram(publicId) });
}
