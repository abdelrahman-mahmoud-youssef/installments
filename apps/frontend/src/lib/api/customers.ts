import { fileToBase64 } from '@/lib/file';
import { CustomerInput } from '@/lib/schemas/customer';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface Customer {
  id: string;
  publicId: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  idImageFrontUrl: string | null;
  idImageBackUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerContractSummary {
  id: string;
  productName: string;
  totalAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  contracts: CustomerContractSummary[];
}

export interface CustomerListItem extends Customer {
  hasOverdue: boolean;
}

export interface CustomerListParams {
  q?: string;
  delayedOnly?: boolean;
  page?: number;
  limit?: number;
}

export function listCustomers(params: CustomerListParams): Promise<PaginatedResult<CustomerListItem>> {
  return apiClient.get(`customers${buildQuery(params)}`);
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiClient.get(`customers/${id}`);
}

async function toCustomerPayload(input: Partial<CustomerInput>): Promise<Record<string, unknown>> {
  const { idImageFront, idImageBack, ...rest } = input;
  const [encodedFront, encodedBack] = await Promise.all([
    idImageFront ? fileToBase64(idImageFront) : undefined,
    idImageBack ? fileToBase64(idImageBack) : undefined,
  ]);
  return { ...rest, idImageFront: encodedFront, idImageBack: encodedBack };
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiClient.post('customers', await toCustomerPayload(input));
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
  return apiClient.patch(`customers/${id}`, await toCustomerPayload(input));
}

export function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete(`customers/${id}`);
}

export type CustomerNotificationType = 'REMINDER' | 'BROADCAST';
export type CustomerNotificationChannel = 'TELEGRAM' | 'WHATSAPP';

export interface CustomerNotificationHistoryItem {
  id: string;
  type: CustomerNotificationType;
  channel: CustomerNotificationChannel;
  success: boolean;
  error: string | null;
  sentAt: string;
  preview: string | null;
}

export interface CustomerNotificationParams {
  page?: number;
  limit?: number;
}

export function getCustomerNotifications(
  id: string,
  params: CustomerNotificationParams,
): Promise<PaginatedResult<CustomerNotificationHistoryItem>> {
  return apiClient.get(`customers/${id}/notifications${buildQuery(params)}`);
}
