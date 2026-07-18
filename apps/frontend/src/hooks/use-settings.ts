import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationSettings,
  NotificationSettings,
  sendTestNotification,
  updateNotificationSettings,
} from '@/lib/api/settings';
import { NotificationSettingsInput } from '@/lib/schemas/settings';

export const settingsKeys = {
  notifications: ['settings', 'notifications'] as const,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: settingsKeys.notifications,
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NotificationSettingsInput) => updateNotificationSettings(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.notifications }),
  });
}

export function useSendTestNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sendTestNotification(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.notifications }),
  });
}

export type { NotificationSettings };
