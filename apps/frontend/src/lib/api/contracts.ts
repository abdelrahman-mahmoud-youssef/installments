import { CalculationMethod, ContractStatus, InstallmentStatus, RecurrenceType } from '@/lib/enums';
import { fileToBase64 } from '@/lib/file';
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
  costPrice: number | null;
  downPayment: number;
  totalAmount: number;
  calculationMethod: CalculationMethod;
  installmentCount: number;
  recurrenceType: RecurrenceType;
  status: ContractStatus;
  createdAt: string;
  imageUrl: string | null;
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

async function toCreateContractPayload(input: ContractInput): Promise<Record<string, unknown>> {
  return {
    customerId: input.customerId,
    productName: input.productName,
    productPrice: toMinorUnits(input.productPrice),
    costPrice: input.costPrice !== undefined ? toMinorUnits(input.costPrice) : undefined,
    downPayment: toMinorUnits(input.downPayment ?? 0),
    calculationMethod: input.calculationMethod,
    markupPercent: input.markupPercent,
    installmentCount: input.installmentCount,
    fixedInstallmentAmount:
      input.fixedInstallmentAmount !== undefined ? toMinorUnits(input.fixedInstallmentAmount) : undefined,
    recurrenceType: input.recurrenceType,
    intervalDays: input.intervalDays,
    startDate: input.startDate,
    firstPaymentDate: input.firstPaymentDate,
    image: input.image ? await fileToBase64(input.image) : undefined,
  };
}

export function listContracts(params: ContractListParams): Promise<PaginatedResult<ContractListItem>> {
  return apiClient.get(`contracts${buildQuery(params)}`);
}

export function getContract(id: string): Promise<ContractDetail> {
  return apiClient.get(`contracts/${id}`);
}

export async function createContract(input: ContractInput): Promise<ContractDetail> {
  return apiClient.post('contracts', await toCreateContractPayload(input));
}

export function cancelContract(id: string): Promise<ContractDetail> {
  return apiClient.patch(`contracts/${id}/status`, { status: 'CANCELLED' });
}
