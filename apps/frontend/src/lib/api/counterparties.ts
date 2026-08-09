import { fileToBase64 } from '@/lib/file';
import { CounterpartyAdjustmentInput, CounterpartyInput } from '@/lib/schemas/counterparty';
import { toMinorUnits } from '@/lib/format';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface Counterparty {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  photoUrl: string | null;
  balance: number;
  createdAt: string;
}

export interface CounterpartyListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export type CounterpartyHistoryItemKind = 'TRANSACTION' | 'ADJUSTMENT';

export interface CounterpartyHistoryItem {
  kind: CounterpartyHistoryItemKind;
  id: string;
  direction: 'IN' | 'OUT';
  amount: number;
  note: string | null;
  occurredAt: string;
  receiptUrl: string | null;
  paymentMethodLabel: string | null;
}

export interface CounterpartyHistoryParams {
  month?: string;
  page?: number;
  limit?: number;
}

export interface CounterpartyHistoryResult extends PaginatedResult<CounterpartyHistoryItem> {
  totalIn: number;
  totalOut: number;
}

export function listCounterparties(params: CounterpartyListParams): Promise<PaginatedResult<Counterparty>> {
  return apiClient.get(`settings/counterparties${buildQuery(params)}`);
}

export function getCounterparty(id: string): Promise<Counterparty> {
  return apiClient.get(`settings/counterparties/${id}`);
}

async function toCounterpartyPayload(input: Partial<CounterpartyInput>): Promise<Record<string, unknown>> {
  const { photo, ...rest } = input;
  return { ...rest, photo: photo ? await fileToBase64(photo) : undefined };
}

export async function createCounterparty(input: CounterpartyInput): Promise<Counterparty> {
  return apiClient.post('settings/counterparties', await toCounterpartyPayload(input));
}

export async function updateCounterparty(id: string, input: Partial<CounterpartyInput>): Promise<Counterparty> {
  return apiClient.patch(`settings/counterparties/${id}`, await toCounterpartyPayload(input));
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

export function createCounterpartyAdjustment(
  id: string,
  input: CounterpartyAdjustmentInput,
): Promise<void> {
  return apiClient.post(`settings/counterparties/${id}/adjustments`, {
    ...input,
    amount: toMinorUnits(input.amount),
  });
}
