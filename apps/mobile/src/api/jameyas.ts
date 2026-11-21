import { apiClient, buildQuery, PaginatedResult } from './client';

export type JameyaStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type JameyaRecurrenceType = 'MONTHLY' | 'WEEKLY';
export type JameyaDueStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type JameyaCycleState = 'UPCOMING' | 'DUE' | 'LATE' | 'PARTIALLY_PAID_OUT' | 'PAID_OUT' | 'SETTLED';

export const JAMEYA_STATUSES: JameyaStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
export const JAMEYA_RECURRENCE_TYPES: JameyaRecurrenceType[] = ['MONTHLY', 'WEEKLY'];

export interface JameyaMemberStanding {
  turnSequence: number;
  remainingAmount: number;
  lateAmount: number;
  receivedAmount: number;
}

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

export type JameyaListParams = {
  status?: JameyaStatus;
  customerId?: string;
  q?: string;
  page?: number;
  limit?: number;
};

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

export interface CreateJameyaInput {
  name: string;
  shareAmount: number;
  recurrenceType: JameyaRecurrenceType;
  firstDueDate: string;
  graceDays: number;
  notes?: string;
  customerIds: string[];
}

export interface UpdateJameyaInput {
  name: string;
  notes: string;
}

export interface JameyaMoneyEntryInput {
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

export function previewJameya(input: CreateJameyaInput): Promise<JameyaPreview> {
  return apiClient.post('jameyas/preview', input);
}

export function createJameya(input: CreateJameyaInput): Promise<JameyaDetail> {
  return apiClient.post('jameyas', input);
}

export function updateJameya(id: string, input: UpdateJameyaInput): Promise<JameyaDetail> {
  return apiClient.patch(`jameyas/${id}`, input);
}

export function listJameyaPayments(
  id: string,
  params: { page: number; limit: number },
): Promise<PaginatedResult<JameyaPayment>> {
  return apiClient.get(`jameyas/${id}/payments${buildQuery(params)}`);
}

export function createJameyaPayment(id: string, input: JameyaMoneyEntryInput): Promise<JameyaPayment> {
  return apiClient.post(`jameyas/${id}/payments`, input);
}

export function createJameyaPayout(
  id: string,
  cycleId: string,
  input: JameyaMoneyEntryInput,
): Promise<JameyaPayoutResult> {
  return apiClient.post(`jameyas/${id}/cycles/${cycleId}/payouts`, input);
}
