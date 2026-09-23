import { apiClient } from './client';

export const TELEGRAM_BOT_TOKEN_MAX_LENGTH = 200;

export type NotificationLanguage = 'AR' | 'EN';

export interface ReminderMessageToggles {
  showProgress: boolean;
  showRemaining: boolean;
  showLocation: boolean;
  showPayLink: boolean;
}

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
  showTelegramOnPublicPage: boolean;
  notificationLanguage: NotificationLanguage;
  reminderMessage: ReminderMessageToggles;
}

export function getNotificationSettings(): Promise<NotificationSettings> {
  return apiClient.get('settings/notifications');
}

export function saveTelegramBotToken(telegramBotToken: string): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications', { telegramBotToken });
}

export function sendTelegramTestMessage(): Promise<void> {
  return apiClient.post('settings/notifications/test');
}

export function disconnectTelegram(): Promise<NotificationSettings> {
  return apiClient.delete('settings/notifications');
}

export function setNotificationLanguage(language: NotificationLanguage): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications/language', { language });
}

export function setTelegramPublicVisibility(showTelegramOnPublicPage: boolean): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications/public-page-visibility', { showTelegramOnPublicPage });
}

export function updateReminderMessageToggles(
  toggles: Partial<ReminderMessageToggles>,
): Promise<NotificationSettings> {
  return apiClient.patch('settings/notifications/reminder-message', toggles);
}
