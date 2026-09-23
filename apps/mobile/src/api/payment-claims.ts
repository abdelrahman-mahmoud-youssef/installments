import { apiClient, buildQuery, PaginatedResult } from './client';
import { InstallmentStatus } from './contracts';

export type PaymentClaimStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface PaymentClaim {
  id: string;
  contractId: string;
  installmentId: string | null;
  paymentMethodId: string;
  amount: number;
  screenshotUrl: string;
  status: PaymentClaimStatus;
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  contract: { productName: string; customer: { name: string } };
  installment: { sequence: number; dueDate: string; status: InstallmentStatus } | null;
  paymentMethod: { label: string; details: string };
}

export type PaymentClaimListParams = {
  status?: PaymentClaimStatus;
  page?: number;
  limit?: number;
};

export interface ApprovePaymentClaimInput {
  amount?: number;
}

export interface DeclinePaymentClaimInput {
  reason?: string;
}

export function listPaymentClaims(params: PaymentClaimListParams): Promise<PaginatedResult<PaymentClaim>> {
  return apiClient.get(`payment-claims${buildQuery(params)}`);
}

export function approvePaymentClaim(id: string, input: ApprovePaymentClaimInput): Promise<PaymentClaim> {
  return apiClient.patch(`payment-claims/${id}/approve`, input);
}

export function declinePaymentClaim(id: string, input: DeclinePaymentClaimInput): Promise<PaymentClaim> {
  return apiClient.patch(`payment-claims/${id}/decline`, input);
}
