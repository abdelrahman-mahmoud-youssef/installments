import { toMinorUnits } from '@/lib/format';
import { PaymentInput } from '@/lib/schemas/payment';
import { ContractPayment } from './contracts';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface PaymentListParams {
  contractId: string;
  page?: number;
  limit?: number;
}

function toCreatePaymentPayload(contractId: string, input: PaymentInput): Record<string, unknown> {
  return {
    contractId,
    amount: toMinorUnits(input.amount),
    note: input.note || undefined,
    allocations: input.allocations?.length
      ? input.allocations.map((allocation) => ({
          installmentId: allocation.installmentId,
          amount: toMinorUnits(allocation.amount),
        }))
      : undefined,
  };
}

export function listPayments(params: PaymentListParams): Promise<PaginatedResult<ContractPayment>> {
  return apiClient.get(`payments${buildQuery(params)}`);
}

export function createPayment(contractId: string, input: PaymentInput): Promise<ContractPayment> {
  return apiClient.post('payments', toCreatePaymentPayload(contractId, input));
}
