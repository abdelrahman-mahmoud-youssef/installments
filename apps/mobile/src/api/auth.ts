import { apiClient } from './client';

export type Role = 'ADMIN' | 'STAFF';

export interface CurrentUserTenant {
  slug: string;
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  twoFactorEnabled: boolean;
  tenant: CurrentUserTenant;
}

export type LoginResult = { accessToken: string } | { requiresTwoFactor: true; challengeToken: string };

export function login(email: string, password: string): Promise<LoginResult> {
  return apiClient.post('auth/login', { email, password });
}

export function verifyTwoFactor(challengeToken: string, code: string): Promise<{ accessToken: string }> {
  return apiClient.post('auth/2fa/verify', { challengeToken, code });
}

export function getMe(): Promise<CurrentUser> {
  return apiClient.get('auth/me');
}
