import { NotificationSettingsInput } from '@/lib/schemas/settings';
import { apiClient } from './client';

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
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
