import { JameyaCycleState, JameyaDueStatus, JameyaRecurrenceType, JameyaStatus } from '@/lib/enums';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface JameyaListItem {
  id: string;
  name: string;
  status: JameyaStatus;
  shareAmount: number;
  shareCount: number;
  recurrenceType: JameyaRecurrenceType;
  firstDueDate: string;
  graceDays: number;
  createdAt: string;
  potAmount: number;
  nextCycle: { sequence: number; dueDate: string } | null;
  lateDueCount: number;
  member?: JameyaMemberStanding;
}

export interface JameyaMemberStanding {
  turnSequences: number[];
  remainingAmount: number;
  lateAmount: number;
  receivedAmount: number;
}

export interface JameyaListParams {
  status?: JameyaStatus;
  customerId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface JameyaPayout {
  id: string;
  cycleId: string;
  customerId: string;
  amount: number;
  collectedAmount: number;
  coveredAmount: number;
  paidAt: string;
  note: string | null;
  createdAt: string;
}

export interface JameyaCycleHolder {
  customerId: string;
  halves: number;
  entitlementAmount: number;
  paidOutAmount: number;
  remainingAmount: number;
}

export interface JameyaCycle {
  id: string;
  sequence: number;
  dueDate: string;
  lateAfter: string;
  state: JameyaCycleState;
  potAmount: number;
  collectedAmount: number;
  paidOutAmount: number;
  exposureAmount: number;
  holders: JameyaCycleHolder[];
  payouts: JameyaPayout[];
}

export interface JameyaMember {
  customerId: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  turnSequences: number[];
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueNowAmount: number;
  lateAmount: number;
  lateDueCount: number;
  receivedAmount: number;
  reminderMessage: string | null;
}

export interface JameyaDue {
  id: string;
  cycleId: string;
  customerId: string;
  amount: number;
  paidAmount: number;
  status: JameyaDueStatus;
  isLate: boolean;
}

export interface JameyaDetail extends Omit<JameyaListItem, 'nextCycle' | 'lateDueCount' | 'member'> {
  notes: string | null;
  updatedAt: string;
  collectedAmount: number;
  paidOutAmount: number;
  exposureAmount: number;
  members: JameyaMember[];
  cycles: JameyaCycle[];
  dues: JameyaDue[];
}

export interface JameyaPayment {
  id: string;
  jameyaId: string;
  customerId: string;
  amount: number;
  balanceAfter: number;
  paidAt: string;
  note: string | null;
  clientRequestId: string;
  createdAt: string;
  allocations: { dueId: string; amount: number }[];
}

export interface JameyaPayoutResult extends JameyaPayout {
  remainingAmount: number;
}

export interface JameyaPreview {
  potAmount: number;
  cycles: {
    sequence: number;
    dueDate: string;
    lateAfter: string;
    holders: { customerId: string; halves: number; entitlementAmount: number }[];
  }[];
  dueAmounts: { customerId: string; amount: number }[];
}

export interface CreateJameyaPayload {
  name: string;
  shareAmount: number;
  recurrenceType: JameyaRecurrenceType;
  firstDueDate: string;
  graceDays: number;
  notes?: string;
  customerIds: string[];
}

export interface UpdateJameyaPayload {
  name: string;
  notes: string;
}

export interface JameyaMoneyEntryPayload {
  customerId: string;
  amount: number;
  paidAt: string;
  note?: string;
  clientRequestId: string;
}

export function listJameyas(params: JameyaListParams): Promise<PaginatedResult<JameyaListItem>> {
  return apiClient.get(`jameyas${buildQuery(params)}`);
}

export function getJameya(id: string): Promise<JameyaDetail> {
  return apiClient.get(`jameyas/${id}`);
}

export function previewJameya(payload: CreateJameyaPayload): Promise<JameyaPreview> {
  return apiClient.post('jameyas/preview', payload);
}

export function createJameya(payload: CreateJameyaPayload): Promise<JameyaDetail> {
  return apiClient.post('jameyas', payload);
}

export function updateJameya(id: string, payload: UpdateJameyaPayload): Promise<JameyaDetail> {
  return apiClient.patch(`jameyas/${id}`, payload);
}

export function listJameyaPayments(
  id: string,
  params: { page: number; limit: number },
): Promise<PaginatedResult<JameyaPayment>> {
  return apiClient.get(`jameyas/${id}/payments${buildQuery(params)}`);
}

export function createJameyaPayment(id: string, payload: JameyaMoneyEntryPayload): Promise<JameyaPayment> {
  return apiClient.post(`jameyas/${id}/payments`, payload);
}

export function createJameyaPayout(
  id: string,
  cycleId: string,
  payload: JameyaMoneyEntryPayload,
): Promise<JameyaPayoutResult> {
  return apiClient.post(`jameyas/${id}/cycles/${cycleId}/payouts`, payload);
}
