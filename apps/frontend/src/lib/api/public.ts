import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import { config } from '@/lib/config';
import { ContractStatus } from '@/lib/enums';
import { TenantBranding } from './branding';

export interface PublicUpcomingInstallment {
  dueDate: string;
  remainingAmount: number;
}

export interface PublicPayment {
  paidAt: string;
  amount: number;
}

export interface PublicContractSummary {
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  payments: PublicPayment[];
  upcomingInstallments: PublicUpcomingInstallment[];
}

export interface PublicTelegramStatus {
  available: boolean;
  botUsername: string | null;
  connected: boolean;
  enabled: boolean;
  broadcastsEnabled: boolean;
  language: NotificationLanguage;
}

export interface PublicTelegramState {
  connected: boolean;
  enabled: boolean;
  broadcastsEnabled: boolean;
  language: NotificationLanguage;
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
  telegram: PublicTelegramStatus;
  branding: TenantBranding;
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

export function setPublicTelegramLanguage(
  publicId: string,
  language: NotificationLanguage,
): Promise<PublicTelegramState> {
  return requestPublic(`customers/${publicId}/telegram/language`, {
    method: 'PATCH',
    body: JSON.stringify({ language }),
  });
}

export function setPublicTelegramBroadcasts(
  publicId: string,
  enabled: boolean,
): Promise<PublicTelegramState> {
  return requestPublic(`customers/${publicId}/telegram/broadcasts`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}
