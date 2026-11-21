import { JameyaStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { lateJameyaDueWhere, OUTSTANDING_JAMEYA_DUE_STATUSES } from './jameya-late-where';

export interface JameyaSummaryTotals {
  dueTodayCount: number;
  lateCount: number;
  payoutsDueTodayCount: number;
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
  const [dueTodayCount, lateCount, payoutsDueTodayCount] = await Promise.all([
    prisma.jameyaDue.count({
      where: { ...activeJameya, status: { in: OUTSTANDING_JAMEYA_DUE_STATUSES }, cycle: { dueDate: today } },
    }),
    prisma.jameyaDue.count({ where: { ...activeJameya, ...lateJameyaDueWhere(today) } }),
    prisma.jameyaCycle.count({ where: { ...activeJameya, dueDate: today } }),
  ]);
  return { dueTodayCount, lateCount, payoutsDueTodayCount };
}
