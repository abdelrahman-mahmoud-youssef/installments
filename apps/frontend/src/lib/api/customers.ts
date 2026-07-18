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

export interface CustomerListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export function listCustomers(params: CustomerListParams): Promise<PaginatedResult<Customer>> {
  return apiClient.get(`customers${buildQuery(params)}`);
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiClient.get(`customers/${id}`);
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiClient.post('customers', input);
}

export function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
  return apiClient.patch(`customers/${id}`, input);
}

export function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete(`customers/${id}`);
}
