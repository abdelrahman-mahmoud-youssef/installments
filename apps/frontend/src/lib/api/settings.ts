import { NotificationSettingsInput } from '@/lib/schemas/settings';
import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import { apiClient } from './client';

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
  notificationLanguage: NotificationLanguage;
}

export function getNotificationSettings(): Promise<NotificationSettings> {
  return apiClient.get('settings/notifications');
}

export function updateNotificationSettings(
  input: NotificationSettingsInput,
): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications', input);
}

export function sendTestNotification(): Promise<void> {
  return apiClient.post('settings/notifications/test');
}

export function disconnectNotifications(): Promise<NotificationSettings> {
  return apiClient.delete('settings/notifications');
}

export function setNotificationLanguage(language: NotificationLanguage): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications/language', { language });
}
