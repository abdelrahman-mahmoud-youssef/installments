import { SubscriptionStatus } from '@/lib/enums';
import { apiClient, ApiError, ApiErrorBody, postJson } from './client';

export type Role = 'ADMIN' | 'STAFF';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  businessName: string;
  name: string;
  email: string;
  password: string;
}

export interface CurrentUserSubscription {
  status: SubscriptionStatus;
  expiresOn: string;
  monthlyPrice: number;
  paymentAddress: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  twoFactorEnabled: boolean;
  subscription: CurrentUserSubscription;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export type LoginResponse = { success: true } | { requiresTwoFactor: true; challengeToken: string };

function postAuth(path: string, payload: unknown): Promise<LoginResponse> {
  return postJson<LoginResponse>(`/api/auth/${path}`, payload);
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return postAuth('login', payload);
}

export function register(payload: RegisterPayload): Promise<LoginResponse> {
  return postAuth('register', payload);
}

export function verifyTwoFactor(challengeToken: string, code: string): Promise<LoginResponse> {
  return postAuth('verify-2fa', { challengeToken, code });
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<CurrentUser> {
  return apiClient.get('auth/me');
}

export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return apiClient.patch('auth/password', payload);
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body ?? { statusCode: response.status, message: 'Something went wrong.', error: 'Error' },
    );
  }
}

export function resetPassword(payload: ResetPasswordPayload): Promise<LoginResponse> {
  return postAuth('reset-password', payload);
}
