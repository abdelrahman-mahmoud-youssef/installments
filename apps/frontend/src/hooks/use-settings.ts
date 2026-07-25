import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import {
  disconnectNotifications,
  getNotificationSettings,
  NotificationSettings,
  ReminderMessageToggles,
  sendTestNotification,
  setNotificationLanguage,
  setTelegramPublicVisibility,
  updateNotificationSettings,
  updateReminderMessageSettings,
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

export function useDisconnectNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectNotifications(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.notifications }),
  });
}

export function useSetNotificationLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: NotificationLanguage) => setNotificationLanguage(language),
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.notifications, data),
  });
}

export function useSetTelegramPublicVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (showTelegramOnPublicPage: boolean) => setTelegramPublicVisibility(showTelegramOnPublicPage),
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.notifications, data),
  });
}

export function useUpdateReminderMessageSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ReminderMessageToggles>) => updateReminderMessageSettings(input),
    onSuccess: (data) => queryClient.setQueryData(settingsKeys.notifications, data),
  });
}

export type { NotificationSettings, ReminderMessageToggles };
