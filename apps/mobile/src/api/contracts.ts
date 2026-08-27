import { apiClient, buildQuery, PaginatedResult } from './client';

export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface Installment {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
}

export interface PaymentAllocation {
  id: string;
  installmentId: string;
  amount: number;
}

export interface ContractPayment {
  id: string;
  amount: number;
  paidAt: string;
  note: string | null;
  allocations: PaymentAllocation[];
}

export interface ContractCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface ContractListItem {
  id: string;
  productName: string;
  productPrice: number;
  downPayment: number;
  totalAmount: number;
  installmentCount: number;
  status: ContractStatus;
  createdAt: string;
  imageUrl: string | null;
  customer: ContractCustomer;
  hasOverdue: boolean;
}

export interface ContractDetail extends Omit<ContractListItem, 'customer'> {
  publicId: string;
  customer: ContractCustomer & { publicId: string; address: string | null; notes: string | null };
  installments: Installment[];
  payments: ContractPayment[];
}

export interface ContractListParams {
  status?: ContractStatus;
  customerId?: string;
  delayedOnly?: boolean;
  page?: number;
  limit?: number;
}

export function listContracts(params: ContractListParams): Promise<PaginatedResult<ContractListItem>> {
  return apiClient.get(`contracts${buildQuery({ ...params })}`);
}

export function getContract(id: string): Promise<ContractDetail> {
  return apiClient.get(`contracts/${id}`);
}
