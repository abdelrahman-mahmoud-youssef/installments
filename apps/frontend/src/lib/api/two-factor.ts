import { apiClient } from './client';

export interface SetupTwoFactorResult {
  secret: string;
  otpauthUrl: string;
}

export interface EnableTwoFactorResult {
  backupCodes: string[];
}

export function setupTwoFactor(): Promise<SetupTwoFactorResult> {
  return apiClient.post('auth/2fa/setup');
}

export function enableTwoFactor(code: string): Promise<EnableTwoFactorResult> {
  return apiClient.post('auth/2fa/enable', { code });
}

export function disableTwoFactor(code: string): Promise<void> {
  return apiClient.post('auth/2fa/disable', { code });
}
