import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JameyaStatus, Prisma } from '@prisma/client';
import { calculatePot } from './jameya-amounts';
import { OUTSTANDING_JAMEYA_DUE_STATUSES } from './jameya-late-where';

export interface LockedJameya {
  id: string;
  status: JameyaStatus;
  shareAmount: number;
  shareCount: number;
}

export async function lockJameya(
  tx: Prisma.TransactionClient,
  tenantId: string,
  jameyaId: string,
): Promise<LockedJameya> {
  const [jameya] = await tx.$queryRaw<LockedJameya[]>`
    SELECT "id", "status", "shareAmount", "shareCount" FROM "Jameya"
    WHERE "id" = ${jameyaId} AND "tenantId" = ${tenantId}
    FOR UPDATE`;
  if (!jameya) {
    throw new NotFoundException('Jameya not found.');
  }
  return jameya;
}

export function assertJameyaActive(jameya: LockedJameya): void {
  if (jameya.status !== JameyaStatus.ACTIVE) {
    throw new BadRequestException('This jameya is no longer active.');
  }
}

export async function completeJameyaIfFinished(tx: Prisma.TransactionClient, jameya: LockedJameya): Promise<void> {
  const [outstandingDueCount, payouts] = await Promise.all([
    tx.jameyaDue.count({ where: { jameyaId: jameya.id, status: { in: OUTSTANDING_JAMEYA_DUE_STATUSES } } }),
    tx.jameyaPayout.aggregate({ where: { jameyaId: jameya.id }, _sum: { amount: true } }),
  ]);
  const totalEntitlement = calculatePot(jameya.shareAmount, jameya.shareCount) * jameya.shareCount;
  if (outstandingDueCount === 0 && payouts._sum.amount === totalEntitlement) {
    await tx.jameya.update({ where: { id: jameya.id }, data: { status: JameyaStatus.COMPLETED } });
  }
}
