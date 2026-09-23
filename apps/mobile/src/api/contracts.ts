import { apiClient, buildQuery, PaginatedResult } from './client';

export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type CalculationMethod = 'FIXED_COUNT' | 'FIXED_AMOUNT' | 'MARKUP_PERCENT';
export type RecurrenceType = 'MONTHLY' | 'EVERY_X_DAYS' | 'WEEKLY' | 'BIWEEKLY';

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
  paymentMethodId: string | null;
  allocations: PaymentAllocation[];
}

export interface ContractCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface ContractListItem {
  id: string;
  publicId: string;
  productName: string;
  productPrice: number;
  costPrice: number | null;
  downPayment: number;
  totalAmount: number;
  calculationMethod: CalculationMethod;
  markupPercent: number | null;
  installmentCount: number;
  recurrenceType: RecurrenceType;
  intervalDays: number | null;
  startDate: string;
  firstPaymentDate: string;
  status: ContractStatus;
  tag: string | null;
  createdAt: string;
  imageUrl: string | null;
  customer: ContractCustomer;
  hasOverdue: boolean;
}

export interface ContractDetail extends Omit<ContractListItem, 'customer' | 'hasOverdue'> {
  customer: ContractCustomer & {
    publicId: string;
    address: string | null;
    notes: string | null;
    photoUrl: string | null;
  };
  installments: Installment[];
  payments: ContractPayment[];
  reminderMessage: string | null;
}

export type ContractListParams = {
  status?: ContractStatus;
  customerId?: string;
  delayedOnly?: boolean;
  tag?: string;
  page?: number;
  limit?: number;
};

export interface CreateContractInput {
  customerId: string;
  productName: string;
  tag?: string;
  productPrice: number;
  downPayment: number;
  costPrice?: number;
  image?: string;
  calculationMethod: CalculationMethod;
  markupPercent?: number;
  installmentCount?: number;
  fixedInstallmentAmount?: number;
  recurrenceType: RecurrenceType;
  intervalDays?: number;
  startDate: string;
  firstPaymentDate: string;
}

export function listContracts(params: ContractListParams): Promise<PaginatedResult<ContractListItem>> {
  return apiClient.get(`contracts${buildQuery(params)}`);
}

export function getContract(id: string): Promise<ContractDetail> {
  return apiClient.get(`contracts/${id}`);
}

export function createContract(input: CreateContractInput): Promise<ContractDetail> {
  return apiClient.post('contracts', input);
}

export function cancelContract(id: string): Promise<ContractDetail> {
  return apiClient.patch(`contracts/${id}/status`, { status: 'CANCELLED' });
}

export function updateContractTag(id: string, tag: string): Promise<ContractDetail> {
  return apiClient.patch(`contracts/${id}/tag`, { tag });
}

export function listContractTags(): Promise<string[]> {
  return apiClient.get('contracts/tags');
}
