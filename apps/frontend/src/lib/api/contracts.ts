import { CalculationMethod, ContractStatus, InstallmentStatus, RecurrenceType } from '@/lib/enums';
import { toMinorUnits } from '@/lib/format';
import { ContractInput } from '@/lib/schemas/contract';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

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
  calculationMethod: CalculationMethod;
  installmentCount: number;
  recurrenceType: RecurrenceType;
  status: ContractStatus;
  createdAt: string;
  customer: ContractCustomer;
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
  page?: number;
  limit?: number;
}

function toCreateContractPayload(input: ContractInput): Record<string, unknown> {
  return {
    customerId: input.customerId,
    productName: input.productName,
    productPrice: toMinorUnits(input.productPrice),
    downPayment: toMinorUnits(input.downPayment),
    calculationMethod: input.calculationMethod,
    markupPercent: input.markupPercent,
    installmentCount: input.installmentCount,
    fixedInstallmentAmount:
      input.fixedInstallmentAmount !== undefined ? toMinorUnits(input.fixedInstallmentAmount) : undefined,
    recurrenceType: input.recurrenceType,
    intervalDays: input.intervalDays,
    startDate: input.startDate,
    firstPaymentDate: input.firstPaymentDate,
  };
}

export function listContracts(params: ContractListParams): Promise<PaginatedResult<ContractListItem>> {
  return apiClient.get(`contracts${buildQuery(params)}`);
}

export function getContract(id: string): Promise<ContractDetail> {
  return apiClient.get(`contracts/${id}`);
}

export function createContract(input: ContractInput): Promise<ContractDetail> {
  return apiClient.post('contracts', toCreateContractPayload(input));
}

export function cancelContract(id: string): Promise<ContractDetail> {
  return apiClient.patch(`contracts/${id}/status`, { status: 'CANCELLED' });
}
