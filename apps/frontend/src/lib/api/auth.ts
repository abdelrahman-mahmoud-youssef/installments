import { ApiError, ApiErrorBody } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  businessName: string;
  email: string;
  password: string;
}

async function postAuth(path: 'login' | 'register', payload: unknown): Promise<void> {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorBody;
    throw new ApiError(body);
  }
}

export function login(payload: LoginPayload): Promise<void> {
  return postAuth('login', payload);
}

export function register(payload: RegisterPayload): Promise<void> {
  return postAuth('register', payload);
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
