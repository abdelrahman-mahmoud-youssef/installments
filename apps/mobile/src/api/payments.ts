import { apiClient } from './client';
import { ContractPayment } from './contracts';

export interface ManualAllocation {
  installmentId: string;
  amount: number;
}

export interface CreatePaymentInput {
  contractId: string;
  amount: number;
  paymentMethodId?: string;
  paidAt: string;
  note?: string;
  allocations?: ManualAllocation[];
}

export function createPayment(input: CreatePaymentInput): Promise<ContractPayment> {
  return apiClient.post('payments', input);
}
