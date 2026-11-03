import { apiClient } from './client';

export type Role = 'ADMIN' | 'STAFF';

export const TWO_FACTOR_CODE_LENGTH = 6;
export const TWO_FACTOR_RECOVERY_CODE_MAX_LENGTH = 11;

export interface CurrentUserTenant {
  slug: string;
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED';

export interface CurrentUserSubscription {
  status: SubscriptionStatus;
  expiresOn: string;
  daysRemaining: number;
  isRenewalDueSoon: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  twoFactorEnabled: boolean;
  tenant: CurrentUserTenant;
  subscription: CurrentUserSubscription;
}

export type LoginResult = { accessToken: string } | { requiresTwoFactor: true; challengeToken: string };

export interface RegisterInput {
  businessName: string;
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export interface TwoFactorEnabled {
  backupCodes: string[];
}

export function login(email: string, password: string): Promise<LoginResult> {
  return apiClient.post('auth/login', { email, password });
}

export function register(input: RegisterInput): Promise<{ accessToken: string }> {
  return apiClient.post('auth/register', input);
}

export function verifyTwoFactor(challengeToken: string, code: string): Promise<{ accessToken: string }> {
  return apiClient.post('auth/2fa/verify', { challengeToken, code });
}

export function getMe(): Promise<CurrentUser> {
  return apiClient.get('auth/me');
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiClient.patch('auth/password', input);
}

export function setupTwoFactor(): Promise<TwoFactorSetup> {
  return apiClient.post('auth/2fa/setup');
}

export function enableTwoFactor(code: string): Promise<TwoFactorEnabled> {
  return apiClient.post('auth/2fa/enable', { code });
}

export function disableTwoFactor(code: string): Promise<void> {
  return apiClient.post('auth/2fa/disable', { code });
}
