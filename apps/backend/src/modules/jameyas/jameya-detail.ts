import { JameyaDueStatus, Prisma } from '@prisma/client';
import { calculateEntitlement, calculateExposure, calculatePot } from './jameya-amounts';
import { isJameyaDueLate } from './jameya-late-where';
import { formatJameyaReminderMessage, JameyaReminderStatus } from './jameya-reminder-message';

export const JameyaCycleState = {
  UPCOMING: 'UPCOMING',
  DUE: 'DUE',
  LATE: 'LATE',
  PARTIALLY_PAID_OUT: 'PARTIALLY_PAID_OUT',
  PAID_OUT: 'PAID_OUT',
  SETTLED: 'SETTLED',
} as const;

export type JameyaCycleState = (typeof JameyaCycleState)[keyof typeof JameyaCycleState];

export const JAMEYA_PAYOUT_SELECT = {
  id: true,
  cycleId: true,
  customerId: true,
  amount: true,
  collectedAmount: true,
  coveredAmount: true,
  paidAt: true,
  note: true,
  createdAt: true,
} satisfies Prisma.JameyaPayoutSelect;

export const JAMEYA_DETAIL_INCLUDE = {
  cycles: {
    orderBy: { sequence: 'asc' },
    select: {
      id: true,
      sequence: true,
      dueDate: true,
      lateAfter: true,
      payouts: { orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }], select: JAMEYA_PAYOUT_SELECT },
    },
  },
  shares: {
    orderBy: { cycle: { sequence: 'asc' } },
    select: {
      cycleId: true,
      customerId: true,
      contribution: true,
      cycle: { select: { sequence: true } },
      customer: { select: { name: true, phone: true, photoUrl: true, notificationLanguage: true } },
    },
  },
  dues: { select: { id: true, cycleId: true, customerId: true, amount: true, paidAmount: true, status: true } },
  tenant: { select: { name: true } },
} satisfies Prisma.JameyaInclude;

type JameyaDetailRow = Prisma.JameyaGetPayload<{ include: typeof JAMEYA_DETAIL_INCLUDE }>;
type JameyaDueRow = JameyaDetailRow['dues'][number];
type JameyaShareRow = JameyaDetailRow['shares'][number];
type JameyaCycleRow = JameyaDetailRow['cycles'][number];
export type JameyaPayoutRecord = JameyaCycleRow['payouts'][number];

export interface JameyaDueCell extends JameyaDueRow {
  isLate: boolean;
}

export interface JameyaCycleHolder {
  customerId: string;
  contribution: number;
  entitlementAmount: number;
  paidOutAmount: number;
  remainingAmount: number;
}

export interface JameyaCycleSummary {
  id: string;
  sequence: number;
  dueDate: Date;
  lateAfter: Date;
  state: JameyaCycleState;
  potAmount: number;
  collectedAmount: number;
  paidOutAmount: number;
  exposureAmount: number;
  holders: JameyaCycleHolder[];
  payouts: JameyaPayoutRecord[];
}

export interface JameyaMemberHolding {
  cycleId: string;
  sequence: number;
  contribution: number;
  entitlementAmount: number;
  receivedAmount: number;
}

export interface JameyaMemberSummary {
  customerId: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  turnSequences: number[];
  holdings: JameyaMemberHolding[];
  monthlyAmount: number;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueNowAmount: number;
  lateAmount: number;
  lateDueCount: number;
  receivedAmount: number;
  reminderMessage: string | null;
}

export type JameyaDetail = Omit<JameyaDetailRow, 'cycles' | 'shares' | 'dues' | 'tenant'> & {
  potAmount: number;
  collectedAmount: number;
  paidOutAmount: number;
  exposureAmount: number;
  members: JameyaMemberSummary[];
  cycles: JameyaCycleSummary[];
  dues: JameyaDueCell[];
};

function sumBy<T>(items: T[], amountOf: (item: T) => number): number {
  return items.reduce((total, item) => total + amountOf(item), 0);
}

interface CycleStateInput {
  dueDate: Date;
  holders: JameyaCycleHolder[];
  dues: JameyaDueCell[];
}

export function deriveCycleState({ dueDate, holders, dues }: CycleStateInput, today: Date): JameyaCycleState {
  const duesSettled = dues.every((due) => due.status === JameyaDueStatus.PAID);
  if (holders.every((holder) => holder.remainingAmount === 0)) {
    return duesSettled ? JameyaCycleState.SETTLED : JameyaCycleState.PAID_OUT;
  }
  if (holders.some((holder) => holder.paidOutAmount > 0)) {
    return JameyaCycleState.PARTIALLY_PAID_OUT;
  }
  if (dueDate > today) {
    return JameyaCycleState.UPCOMING;
  }
  return dues.some((due) => due.isLate) ? JameyaCycleState.LATE : JameyaCycleState.DUE;
}

export function buildCycleHolders(
  shares: { customerId: string; contribution: number }[],
  payouts: { customerId: string; amount: number }[],
  shareCount: number,
): JameyaCycleHolder[] {
  return shares.map((share) => {
    const entitlementAmount = calculateEntitlement(share.contribution, shareCount);
    const paidOutAmount = sumBy(
      payouts.filter((payout) => payout.customerId === share.customerId),
      (payout) => payout.amount,
    );
    return {
      customerId: share.customerId,
      contribution: share.contribution,
      entitlementAmount,
      paidOutAmount,
      remainingAmount: entitlementAmount - paidOutAmount,
    };
  });
}

function buildCycleSummary(
  cycle: JameyaCycleRow,
  shares: JameyaShareRow[],
  dues: JameyaDueCell[],
  amounts: { potAmount: number; shareCount: number },
  today: Date,
): JameyaCycleSummary {
  const holders = buildCycleHolders(shares, cycle.payouts, amounts.shareCount);
  const collectedAmount = sumBy(dues, (due) => due.paidAmount);
  const paidOutAmount = sumBy(cycle.payouts, (payout) => payout.amount);

  return {
    id: cycle.id,
    sequence: cycle.sequence,
    dueDate: cycle.dueDate,
    lateAfter: cycle.lateAfter,
    state: deriveCycleState({ dueDate: cycle.dueDate, holders, dues }, today),
    potAmount: amounts.potAmount,
    collectedAmount,
    paidOutAmount,
    exposureAmount: calculateExposure(paidOutAmount, collectedAmount),
    holders,
    payouts: cycle.payouts,
  };
}

interface ReminderContext {
  businessName: string;
  jameyaName: string;
  today: Date;
}

interface OutstandingDue {
  due: JameyaDueCell;
  dueDate: Date;
}

function findOutstandingDues(dues: JameyaDueCell[], cycles: JameyaCycleSummary[]): OutstandingDue[] {
  return cycles.flatMap((cycle) =>
    dues
      .filter((due) => due.cycleId === cycle.id && due.status !== JameyaDueStatus.PAID)
      .map((due) => ({ due, dueDate: cycle.dueDate })),
  );
}

function filterDueByToday(outstanding: OutstandingDue[], today: Date): OutstandingDue[] {
  return outstanding.filter(({ dueDate }) => dueDate <= today);
}

function sumOwed(outstanding: OutstandingDue[]): number {
  return sumBy(outstanding, ({ due }) => due.amount - due.paidAmount);
}

function resolveReminderStatus(reminderDues: OutstandingDue[], today: Date) {
  if (reminderDues.some(({ due }) => due.isLate)) {
    return JameyaReminderStatus.LATE;
  }
  return reminderDues[0].dueDate <= today ? JameyaReminderStatus.DUE : JameyaReminderStatus.UPCOMING;
}

function buildMemberReminder(
  share: JameyaShareRow,
  outstanding: OutstandingDue[],
  context: ReminderContext,
): string | null {
  const dueNow = filterDueByToday(outstanding, context.today);
  const reminderDues = dueNow.length > 0 ? dueNow : outstanding.slice(0, 1);
  if (reminderDues.length === 0) {
    return null;
  }
  return formatJameyaReminderMessage(
    {
      memberName: share.customer.name,
      businessName: context.businessName,
      jameyaName: context.jameyaName,
      amountDue: sumOwed(reminderDues),
      dueDate: reminderDues[0].dueDate,
      status: resolveReminderStatus(reminderDues, context.today),
    },
    share.customer.notificationLanguage,
  );
}

function buildMemberHoldings(customerId: string, cycles: JameyaCycleSummary[]): JameyaMemberHolding[] {
  return cycles.flatMap((cycle) =>
    cycle.holders
      .filter((holder) => holder.customerId === customerId)
      .map((holder) => ({
        cycleId: cycle.id,
        sequence: cycle.sequence,
        contribution: holder.contribution,
        entitlementAmount: holder.entitlementAmount,
        receivedAmount: holder.paidOutAmount,
      })),
  );
}

function buildMemberSummaries(
  shares: JameyaShareRow[],
  dues: JameyaDueCell[],
  cycles: JameyaCycleSummary[],
  context: ReminderContext,
): JameyaMemberSummary[] {
  const customerIds = [...new Set(shares.map((share) => share.customerId))];
  return customerIds.map((customerId) => {
    const customerShares = shares.filter((share) => share.customerId === customerId);
    const memberDues = dues.filter((due) => due.customerId === customerId);
    const lateDues = memberDues.filter((due) => due.isLate);
    const dueAmount = sumBy(memberDues, (due) => due.amount);
    const paidAmount = sumBy(memberDues, (due) => due.paidAmount);
    const outstanding = findOutstandingDues(memberDues, cycles);
    const holdings = buildMemberHoldings(customerId, cycles);
    return {
      customerId,
      name: customerShares[0].customer.name,
      phone: customerShares[0].customer.phone,
      photoUrl: customerShares[0].customer.photoUrl,
      turnSequences: customerShares.map((share) => share.cycle.sequence),
      holdings,
      monthlyAmount: sumBy(holdings, (holding) => holding.contribution),
      dueAmount,
      paidAmount,
      remainingAmount: dueAmount - paidAmount,
      dueNowAmount: sumOwed(filterDueByToday(outstanding, context.today)),
      lateAmount: sumBy(lateDues, (due) => due.amount - due.paidAmount),
      lateDueCount: lateDues.length,
      receivedAmount: sumBy(holdings, (holding) => holding.receivedAmount),
      reminderMessage: buildMemberReminder(customerShares[0], outstanding, context),
    };
  });
}

export function buildJameyaDetail(row: JameyaDetailRow, today: Date): JameyaDetail {
  const { cycles, shares, dues, tenant, ...jameya } = row;
  const potAmount = calculatePot(jameya.shareAmount, jameya.shareCount);
  const dueCellsByCycle = cycles.map((cycle) =>
    dues
      .filter((due) => due.cycleId === cycle.id)
      .map((due) => ({ ...due, isLate: isJameyaDueLate(due.status, cycle.lateAfter, today) })),
  );
  const dueCells = dueCellsByCycle.flat();
  const cycleSummaries = cycles.map((cycle, index) =>
    buildCycleSummary(
      cycle,
      shares.filter((share) => share.cycleId === cycle.id),
      dueCellsByCycle[index],
      { potAmount, shareCount: jameya.shareCount },
      today,
    ),
  );
  const collectedAmount = sumBy(cycleSummaries, (cycle) => cycle.collectedAmount);
  const paidOutAmount = sumBy(cycleSummaries, (cycle) => cycle.paidOutAmount);

  return {
    ...jameya,
    potAmount,
    collectedAmount,
    paidOutAmount,
    exposureAmount: sumBy(cycleSummaries, (cycle) => cycle.exposureAmount),
    members: buildMemberSummaries(shares, dueCells, cycleSummaries, {
      businessName: tenant.name,
      jameyaName: jameya.name,
      today,
    }),
    cycles: cycleSummaries,
    dues: dueCells,
  };
}
