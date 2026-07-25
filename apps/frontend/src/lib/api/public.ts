import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import { config } from '@/lib/config';
import { ContractStatus } from '@/lib/enums';
import { ApiError, ApiErrorBody } from './client';
import { TenantBranding } from './branding';

export interface PublicInstallmentClaim {
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  declineReason: string | null;
}

export interface PublicNextInstallment {
  id: string;
  dueDate: string;
  amount: number;
  isOverdue: boolean;
}

export interface PublicPayment {
  paidAt: string;
  amount: number;
}

export interface PublicInstallment {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  isOverdue: boolean;
  latestClaim: PublicInstallmentClaim | null;
}

export interface PublicPaymentMethod {
  id: string;
  label: string;
  details: string;
  presetKey: string | null;
}

export interface PublicContractPayInfo {
  amountDue: number;
  hasPendingClaim: boolean;
  paymentMethods: PublicPaymentMethod[];
  branding: TenantBranding;
}

export interface PublicContractSummary {
  publicId: string;
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  nextInstallment: PublicNextInstallment | null;
  latestClaim: PublicInstallmentClaim | null;
}

export interface PublicContractDetail {
  productName: string;
  status: ContractStatus;
  totalAmount?: number;
  downPayment?: number;
  paidAmount: number;
  remainingAmount: number;
  payments: PublicPayment[];
  installments: PublicInstallment[];
  paymentMethods: PublicPaymentMethod[];
  branding: TenantBranding;
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
  paymentMethods: PublicPaymentMethod[];
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

export async function getPublicContractDetail(
  publicId: string,
  contractPublicId: string,
): Promise<PublicContractDetail | null> {
  const response = await fetch(`${config.backendUrl}/public/customers/${publicId}/contracts/${contractPublicId}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load contract.');
  }
  return response.json() as Promise<PublicContractDetail>;
}

export async function getContractPayInfo(
  publicId: string,
  contractPublicId: string,
): Promise<PublicContractPayInfo | null> {
  const response = await fetch(
    `${config.backendUrl}/public/customers/${publicId}/contracts/${contractPublicId}/pay-info`,
    { cache: 'no-store' },
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load payment info.');
  }
  return response.json() as Promise<PublicContractPayInfo>;
}

export async function getPublicShop(publicId: string): Promise<TenantBranding | null> {
  const response = await fetch(`${config.backendUrl}/public/shops/${publicId}`, { cache: 'no-store' });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load shop.');
  }
  return response.json() as Promise<TenantBranding>;
}

export interface PublicOffer {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  images: string[];
}

export async function getPublicOffers(publicId: string): Promise<PublicOffer[]> {
  const response = await fetch(`${config.backendUrl}/public/shops/${publicId}/offers`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to load offers.');
  }
  return response.json() as Promise<PublicOffer[]>;
}

async function requestPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/public/${path}`, {
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new ApiError(body as ApiErrorBody);
  }
  return body as T;
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

export interface SubmitPaymentClaimInput {
  paymentMethodId: string;
  screenshot: string;
}

export function submitPaymentClaim(
  publicId: string,
  contractPublicId: string,
  input: SubmitPaymentClaimInput,
): Promise<{ status: 'PENDING' }> {
  return requestPublic(`customers/${publicId}/contracts/${contractPublicId}/payment-claims`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
