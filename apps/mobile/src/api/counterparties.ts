import { apiClient, buildQuery, PaginatedResult } from './client';
import { DirectionTotals, MoneyDirection } from './payment-method-transactions';

export interface Counterparty {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  photoUrl: string | null;
  balance: number;
  createdAt: string;
}

export type CounterpartyListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type CounterpartyHistoryItemKind = 'TRANSACTION' | 'ADJUSTMENT';

export interface CounterpartyHistoryItem {
  kind: CounterpartyHistoryItemKind;
  id: string;
  direction: MoneyDirection;
  amount: number;
  note: string | null;
  occurredAt: string;
  receiptUrl: string | null;
  paymentMethodLabel: string | null;
}

export type CounterpartyHistoryParams = {
  month?: string;
  page?: number;
  limit?: number;
};

export type CounterpartyHistoryResult = PaginatedResult<CounterpartyHistoryItem> & DirectionTotals;

export interface SaveCounterpartyInput {
  name: string;
  phone?: string;
  notes?: string;
  photo?: string;
}

export interface CreateCounterpartyAdjustmentInput {
  direction: MoneyDirection;
  amount: number;
  occurredAt: string;
  note?: string;
}

export function listCounterparties(params: CounterpartyListParams): Promise<PaginatedResult<Counterparty>> {
  return apiClient.get(`settings/counterparties${buildQuery(params)}`);
}

export function getCounterparty(id: string): Promise<Counterparty> {
  return apiClient.get(`settings/counterparties/${id}`);
}

export function createCounterparty(input: SaveCounterpartyInput): Promise<Counterparty> {
  return apiClient.post('settings/counterparties', input);
}

export function updateCounterparty(id: string, input: SaveCounterpartyInput): Promise<Counterparty> {
  return apiClient.patch(`settings/counterparties/${id}`, input);
}

export function deleteCounterparty(id: string): Promise<void> {
  return apiClient.delete(`settings/counterparties/${id}`);
}

export function getCounterpartyHistory(
  id: string,
  params: CounterpartyHistoryParams,
): Promise<CounterpartyHistoryResult> {
  return apiClient.get(`settings/counterparties/${id}/history${buildQuery(params)}`);
}

export function createCounterpartyAdjustment(id: string, input: CreateCounterpartyAdjustmentInput): Promise<void> {
  return apiClient.post(`settings/counterparties/${id}/adjustments`, input);
}
