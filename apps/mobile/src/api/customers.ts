import { apiClient, buildQuery, PaginatedResult } from './client';

export type CustomerStatus = 'ACTIVE' | 'DELETED';

export interface Customer {
  id: string;
  publicId: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  photoUrl: string | null;
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
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  contracts: CustomerContractSummary[];
}

export interface CustomerListParams {
  q?: string;
  status?: CustomerStatus;
  delayedOnly?: boolean;
  page?: number;
  limit?: number;
}

export function listCustomers(params: CustomerListParams): Promise<PaginatedResult<CustomerListItem>> {
  return apiClient.get(`customers${buildQuery({ ...params })}`);
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiClient.get(`customers/${id}`);
}
