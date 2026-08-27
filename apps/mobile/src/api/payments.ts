import { apiClient } from './client';
import { ContractPayment } from './contracts';

export interface CreatePaymentInput {
  contractId: string;
  amount: number;
  paymentMethodId?: string;
  paidAt: string;
  note?: string;
}

export function createPayment(input: CreatePaymentInput): Promise<ContractPayment> {
  return apiClient.post('payments', input);
}
