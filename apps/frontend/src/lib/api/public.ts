import { config } from '@/lib/config';

export interface PublicUpcomingInstallment {
  dueDate: string;
  remainingAmount: number;
}

export interface PublicContractSummary {
  productName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  upcomingInstallments: PublicUpcomingInstallment[];
}

export interface PublicTelegramStatus {
  available: boolean;
  botUsername: string | null;
  connected: boolean;
  enabled: boolean;
}

export interface PublicTelegramState {
  connected: boolean;
  enabled: boolean;
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
  telegram: PublicTelegramStatus;
}

export async function getPublicCustomer(publicId: string): Promise<PublicCustomerResponse | null> {
  const response = await fetch(`${config.backendUrl}/public/customers/${publicId}`, { cache: 'no-store' });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load customer.');
  }
  return response.json() as Promise<PublicCustomerResponse>;
}

async function requestPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/public/${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  if (!response.ok) {
    throw new Error('Request failed.');
  }
  return response.json() as Promise<T>;
}

export function verifyPublicTelegram(publicId: string): Promise<PublicTelegramState> {
  return requestPublic(`customers/${publicId}/telegram/verify`, { method: 'POST' });
}

export function setPublicTelegramEnabled(
  publicId: string,
  enabled: boolean,
): Promise<PublicTelegramState> {
  return requestPublic(`customers/${publicId}/telegram`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export function disconnectPublicTelegram(publicId: string): Promise<PublicTelegramState> {
  return requestPublic(`customers/${publicId}/telegram`, { method: 'DELETE' });
}
