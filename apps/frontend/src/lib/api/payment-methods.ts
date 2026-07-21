import { apiClient } from './client';

export interface PaymentMethod {
  id: string;
  label: string;
  details: string;
  presetKey: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreatePaymentMethodInput {
  label: string;
  details: string;
  presetKey?: string;
}

export interface UpdatePaymentMethodInput {
  label?: string;
  details?: string;
  isActive?: boolean;
}

export function listPaymentMethods(): Promise<PaymentMethod[]> {
  return apiClient.get('settings/payment-methods');
}

export function createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
  return apiClient.post('settings/payment-methods', input);
}

export function updatePaymentMethod(id: string, input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
  return apiClient.patch(`settings/payment-methods/${id}`, input);
}

export function deletePaymentMethod(id: string): Promise<void> {
  return apiClient.delete(`settings/payment-methods/${id}`);
}
