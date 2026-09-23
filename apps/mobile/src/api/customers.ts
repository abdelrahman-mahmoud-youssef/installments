import { apiClient, buildQuery, PaginatedResult } from './client';
import { ContractStatus } from './contracts';

export type CustomerStatus = 'ACTIVE' | 'DELETED';
export type NotificationType = 'REMINDER' | 'BROADCAST';
export type NotificationChannel = 'TELEGRAM' | 'WHATSAPP';

export interface Customer {
  id: string;
  publicId: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  photoUrl: string | null;
  idImageFrontUrl: string | null;
  idImageBackUrl: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItem extends Customer {
  hasOverdue: boolean;
}

export interface CustomerContractSummary {
  id: string;
  productName: string;
  totalAmount: number;
  status: ContractStatus;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  contracts: CustomerContractSummary[];
}

export type CustomerListParams = {
  q?: string;
  status?: CustomerStatus;
  delayedOnly?: boolean;
  page?: number;
  limit?: number;
};

export interface SaveCustomerInput {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  photo?: string;
  idImageFront?: string;
  idImageBack?: string;
}

export interface CustomerNotification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  success: boolean;
  error: string | null;
  sentAt: string;
  preview: string;
}

export type CustomerNotificationParams = {
  page?: number;
  limit?: number;
};

export function listCustomers(params: CustomerListParams): Promise<PaginatedResult<CustomerListItem>> {
  return apiClient.get(`customers${buildQuery(params)}`);
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiClient.get(`customers/${id}`);
}

export function createCustomer(input: SaveCustomerInput): Promise<Customer> {
  return apiClient.post('customers', input);
}

export function updateCustomer(id: string, input: SaveCustomerInput): Promise<Customer> {
  return apiClient.patch(`customers/${id}`, input);
}

export function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete(`customers/${id}`);
}

export function listCustomerNotifications(
  id: string,
  params: CustomerNotificationParams,
): Promise<PaginatedResult<CustomerNotification>> {
  return apiClient.get(`customers/${id}/notifications${buildQuery(params)}`);
}
