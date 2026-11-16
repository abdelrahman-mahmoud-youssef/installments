import { apiClient } from './client';

export type PushLanguage = 'AR' | 'EN';

export function registerPushDevice(token: string, language: PushLanguage): Promise<void> {
  return apiClient.post('push/devices', { token, language });
}

export function unregisterPushDevice(token: string): Promise<void> {
  return apiClient.delete('push/devices', { token });
}
