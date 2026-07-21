import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export type PaymentClaimStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface PaymentClaimEntry {
  id: string;
  amount: number;
  screenshotUrl: string;
  status: PaymentClaimStatus;
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  contract: { productName: string; customer: { name: string } };
  installment: { sequence: number; dueDate: string; status: string };
  paymentMethod: { label: string; details: string };
}

export interface PaymentClaimQueryParams {
  status?: PaymentClaimStatus;
  page?: number;
  limit?: number;
}

export function listPaymentClaims(
  params: PaymentClaimQueryParams,
): Promise<PaginatedResult<PaymentClaimEntry>> {
  return apiClient.get(`payment-claims${buildQuery(params)}`);
}

export function approvePaymentClaim(id: string): Promise<PaymentClaimEntry> {
  return apiClient.patch(`payment-claims/${id}/approve`);
}

export function declinePaymentClaim(id: string, reason?: string): Promise<PaymentClaimEntry> {
  return apiClient.patch(`payment-claims/${id}/decline`, { reason });
}
