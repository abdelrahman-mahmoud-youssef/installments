import { apiClient, ApiError, ApiErrorBody } from './client';

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

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  twoFactorEnabled: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type LoginResponse = { success: true } | { requiresTwoFactor: true; challengeToken: string };

async function postAuth(path: string, payload: unknown): Promise<LoginResponse> {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as LoginResponse | ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(body as ApiErrorBody);
  }
  return body as LoginResponse;
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
