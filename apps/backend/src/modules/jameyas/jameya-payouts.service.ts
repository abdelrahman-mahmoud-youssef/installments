import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJameyaPayoutDto } from './dto/create-jameya-payout.dto';
import { calculateCoveredAmount, calculateEntitlement, calculatePot } from './jameya-amounts';
import { JAMEYA_PAYOUT_SELECT, JameyaPayoutRecord } from './jameya-detail';
import { assertJameyaActive, completeJameyaIfFinished, lockJameya } from './jameya-transaction';

export type JameyaPayoutResult = JameyaPayoutRecord & { remainingAmount: number };

function sumAmounts(rows: { amount: number }[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}

@Injectable()
export class JameyaPayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    jameyaId: string,
    cycleId: string,
    dto: CreateJameyaPayoutDto,
  ): Promise<JameyaPayoutResult> {
    const payoutId = await this.prisma.$transaction(async (tx) => {
      const jameya = await lockJameya(tx, tenantId, jameyaId);
      const replayed = await tx.jameyaPayout.findFirst({
        where: { tenantId, jameyaId, clientRequestId: dto.clientRequestId },
        select: { id: true },
      });
      if (replayed) {
        return replayed.id;
      }
      assertJameyaActive(jameya);

      const cycle = await tx.jameyaCycle.findFirst({
        where: { id: cycleId, jameyaId },
        select: { dueDate: true, shares: { where: { customerId: dto.customerId }, select: { halves: true } } },
      });
      if (!cycle) {
        throw new NotFoundException('Cycle not found.');
      }
      const [share] = cycle.shares;
      if (!share) {
        throw new BadRequestException('This customer does not hold this turn.');
      }
      if (cycle.dueDate > getUtcToday()) {
        throw new BadRequestException('This turn is not due yet.');
      }

      const [collected, cyclePayouts] = await Promise.all([
        tx.jameyaDue.aggregate({ where: { cycleId }, _sum: { paidAmount: true } }),
        tx.jameyaPayout.findMany({ where: { cycleId }, select: { customerId: true, amount: true } }),
      ]);
      const entitlement = calculateEntitlement(calculatePot(jameya.shareAmount, jameya.shareCount), share.halves);
      const remaining = entitlement - sumAmounts(cyclePayouts.filter((payout) => payout.customerId === dto.customerId));
      if (dto.amount > remaining) {
        throw new BadRequestException(
          remaining === 0
            ? 'This turn has already been paid out in full.'
            : 'The payout is more than what is left for this turn.',
        );
      }

      const collectedAmount = collected._sum.paidAmount ?? 0;
      const payout = await tx.jameyaPayout.create({
        data: {
          tenantId,
          jameyaId,
          cycleId,
          customerId: dto.customerId,
          amount: dto.amount,
          collectedAmount,
          coveredAmount: calculateCoveredAmount({
            collected: collectedAmount,
            paidOutBefore: sumAmounts(cyclePayouts),
            amount: dto.amount,
          }),
          paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
          note: dto.note,
          clientRequestId: dto.clientRequestId,
        },
      });

      await completeJameyaIfFinished(tx, jameya);
      return payout.id;
    });
    return this.findResult(payoutId);
  }

  private async findResult(payoutId: string): Promise<JameyaPayoutResult> {
    const { jameya, ...payout } = await this.prisma.jameyaPayout.findUniqueOrThrow({
      where: { id: payoutId },
      select: { ...JAMEYA_PAYOUT_SELECT, jameya: { select: { shareAmount: true, shareCount: true } } },
    });
    const [share, paidOut] = await Promise.all([
      this.prisma.jameyaShare.findUniqueOrThrow({
        where: { cycleId_customerId: { cycleId: payout.cycleId, customerId: payout.customerId } },
        select: { halves: true },
      }),
      this.prisma.jameyaPayout.aggregate({
        where: { cycleId: payout.cycleId, customerId: payout.customerId },
        _sum: { amount: true },
      }),
    ]);
    const entitlement = calculateEntitlement(calculatePot(jameya.shareAmount, jameya.shareCount), share.halves);
    return { ...payout, remainingAmount: entitlement - (paidOut._sum.amount ?? 0) };
  }
}
