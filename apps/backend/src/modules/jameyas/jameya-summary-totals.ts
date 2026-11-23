import { JameyaStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildCycleHolders } from './jameya-detail';
import { lateJameyaDueWhere, OUTSTANDING_JAMEYA_DUE_STATUSES } from './jameya-late-where';

export interface JameyaSummaryTotals {
  dueTodayCount: number;
  lateCount: number;
  payoutsPendingCount: number;
}

export async function computeJameyaSummaryTotals(
  prisma: PrismaService,
  tenant: { id: string; jameyaEnabled: boolean },
  today: Date,
): Promise<JameyaSummaryTotals | undefined> {
  if (!tenant.jameyaEnabled) {
    return undefined;
  }
  const activeJameya = { tenantId: tenant.id, jameya: { status: JameyaStatus.ACTIVE } };
  const [dueTodayCount, lateCount, dueCycles] = await Promise.all([
    prisma.jameyaDue.count({
      where: { ...activeJameya, status: { in: OUTSTANDING_JAMEYA_DUE_STATUSES }, cycle: { dueDate: today } },
    }),
    prisma.jameyaDue.count({ where: { ...activeJameya, ...lateJameyaDueWhere(today) } }),
    prisma.jameyaCycle.findMany({
      where: { ...activeJameya, dueDate: { lte: today } },
      select: {
        jameya: { select: { shareCount: true } },
        shares: { select: { customerId: true, contribution: true } },
        payouts: { select: { customerId: true, amount: true } },
      },
    }),
  ]);
  const payoutsPendingCount = dueCycles.filter((cycle) =>
    buildCycleHolders(cycle.shares, cycle.payouts, cycle.jameya.shareCount).some(
      (holder) => holder.remainingAmount > 0,
    ),
  ).length;
  return { dueTodayCount, lateCount, payoutsPendingCount };
}
