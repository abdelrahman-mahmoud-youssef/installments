import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerStatus, Prisma } from '@prisma/client';
import { JAMEYA_MIN_MEMBERS } from '../../common/constants';
import { getUtcToday } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJameyaDto } from './dto/create-jameya.dto';
import { JameyaQueryDto } from './dto/jameya-query.dto';
import { UpdateJameyaDto } from './dto/update-jameya.dto';
import { calculateEntitlement, calculatePot } from './jameya-amounts';
import { buildJameyaDetail, JAMEYA_DETAIL_INCLUDE, JameyaDetail } from './jameya-detail';
import { lateJameyaDueWhere } from './jameya-late-where';
import {
  buildJameyaSchedule,
  InvalidJameyaTurnsError,
  JameyaSchedule,
  PlannedDueAmount,
  RequestedTurn,
} from './jameya-schedule';

function buildListSelect(today: Date) {
  return {
    id: true,
    name: true,
    status: true,
    shareAmount: true,
    shareCount: true,
    recurrenceType: true,
    firstDueDate: true,
    graceDays: true,
    createdAt: true,
    cycles: {
      where: { dueDate: { gte: today } },
      orderBy: { sequence: 'asc' },
      take: 1,
      select: { sequence: true, dueDate: true },
    },
    _count: { select: { dues: { where: lateJameyaDueWhere(today) } } },
  } satisfies Prisma.JameyaSelect;
}

type JameyaListRow = Prisma.JameyaGetPayload<{ select: ReturnType<typeof buildListSelect> }>;

export interface JameyaMemberStanding {
  turnSequences: number[];
  monthlyAmount: number;
  remainingAmount: number;
  lateAmount: number;
  receivedAmount: number;
}

export type JameyaListItem = Omit<JameyaListRow, 'cycles' | '_count'> & {
  potAmount: number;
  nextCycle: JameyaListRow['cycles'][number] | null;
  lateDueCount: number;
  member?: JameyaMemberStanding;
};

function requestedTurnsOf(dto: CreateJameyaDto): RequestedTurn[] {
  if (dto.turns && dto.customerIds) {
    throw new BadRequestException('Send either turns or customerIds, not both.');
  }
  return dto.turns ?? (dto.customerIds ?? []).map((customerId) => ({ holders: [{ customerId }] }));
}

function owedOf(sum: { amount: number | null; paidAmount: number | null }): number {
  return (sum.amount ?? 0) - (sum.paidAmount ?? 0);
}

export interface JameyaPreviewCycle {
  sequence: number;
  dueDate: Date;
  lateAfter: Date;
  holders: { customerId: string; contribution: number; entitlementAmount: number }[];
}

export interface JameyaPreview {
  potAmount: number;
  cycles: JameyaPreviewCycle[];
  dueAmounts: PlannedDueAmount[];
}

@Injectable()
export class JameyasService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(tenantId: string, dto: CreateJameyaDto): Promise<JameyaPreview> {
    const schedule = await this.planSchedule(tenantId, dto);
    const potAmount = calculatePot(dto.shareAmount, schedule.cycles.length);
    return {
      potAmount,
      cycles: schedule.cycles.map((cycle) => ({
        sequence: cycle.sequence,
        dueDate: cycle.dueDate,
        lateAfter: cycle.lateAfter,
        holders: cycle.holders.map((holder) => ({
          ...holder,
          entitlementAmount: calculateEntitlement(holder.contribution, schedule.cycles.length),
        })),
      })),
      dueAmounts: schedule.dueAmounts,
    };
  }

  async create(tenantId: string, dto: CreateJameyaDto): Promise<JameyaDetail> {
    const schedule = await this.planSchedule(tenantId, dto);
    const firstDueDate = new Date(dto.firstDueDate);

    const jameyaId = await this.prisma.$transaction(async (tx) => {
      const jameya = await tx.jameya.create({
        data: {
          tenantId,
          name: dto.name,
          shareAmount: dto.shareAmount,
          shareCount: schedule.cycles.length,
          recurrenceType: dto.recurrenceType,
          firstDueDate,
          graceDays: dto.graceDays,
          notes: dto.notes,
        },
      });
      const createdCycles = await tx.jameyaCycle.createManyAndReturn({
        data: schedule.cycles.map((cycle) => ({
          tenantId,
          jameyaId: jameya.id,
          sequence: cycle.sequence,
          dueDate: cycle.dueDate,
          lateAfter: cycle.lateAfter,
        })),
        select: { id: true, sequence: true },
      });

      await tx.jameyaShare.createMany({
        data: createdCycles.flatMap((cycle) =>
          schedule.cycles[cycle.sequence - 1].holders.map((holder) => ({
            tenantId,
            jameyaId: jameya.id,
            cycleId: cycle.id,
            customerId: holder.customerId,
            contribution: holder.contribution,
          })),
        ),
      });
      await tx.jameyaDue.createMany({
        data: createdCycles.flatMap((cycle) =>
          schedule.dues
            .filter((due) => due.sequence === cycle.sequence)
            .map((due) => ({
              tenantId,
              jameyaId: jameya.id,
              cycleId: cycle.id,
              customerId: due.customerId,
              amount: due.amount,
            })),
        ),
      });
      return jameya.id;
    });

    return this.findOne(tenantId, jameyaId);
  }

  private async planSchedule(tenantId: string, dto: CreateJameyaDto): Promise<JameyaSchedule> {
    const turns = requestedTurnsOf(dto);
    const memberIds = [...new Set(turns.flatMap((turn) => turn.holders.map((holder) => holder.customerId)))];
    if (memberIds.length < JAMEYA_MIN_MEMBERS) {
      throw new BadRequestException('A jameya needs at least two different members.');
    }
    const memberCount = await this.prisma.customer.count({
      where: { id: { in: memberIds }, tenantId, status: CustomerStatus.ACTIVE },
    });
    if (memberCount !== memberIds.length) {
      throw new NotFoundException('Customer not found.');
    }
    try {
      return buildJameyaSchedule({
        shareAmount: dto.shareAmount,
        recurrenceType: dto.recurrenceType,
        firstDueDate: new Date(dto.firstDueDate),
        graceDays: dto.graceDays,
        turns,
      });
    } catch (error) {
      if (error instanceof InvalidJameyaTurnsError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: JameyaQueryDto): Promise<PaginatedResult<JameyaListItem>> {
    const today = getUtcToday();
    const where: Prisma.JameyaWhereInput = {
      tenantId,
      status: query.status,
      ...(query.customerId ? { shares: { some: { customerId: query.customerId } } } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.jameya.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: buildListSelect(today),
      }),
      this.prisma.jameya.count({ where }),
    ]);

    const standings = query.customerId
      ? await this.findMemberStandings(tenantId, query.customerId, rows.map((row) => row.id), today)
      : new Map<string, JameyaMemberStanding>();
    const data = rows.map(({ cycles, _count, ...jameya }) => ({
      ...jameya,
      potAmount: calculatePot(jameya.shareAmount, jameya.shareCount),
      nextCycle: cycles[0] ?? null,
      lateDueCount: _count.dues,
      member: standings.get(jameya.id),
    }));
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  private async findMemberStandings(
    tenantId: string,
    customerId: string,
    jameyaIds: string[],
    today: Date,
  ): Promise<Map<string, JameyaMemberStanding>> {
    const memberWhere = { tenantId, customerId, jameyaId: { in: jameyaIds } };
    const [shares, dues, lateDues, payouts] = await Promise.all([
      this.prisma.jameyaShare.findMany({
        where: memberWhere,
        orderBy: { cycle: { sequence: 'asc' } },
        select: { jameyaId: true, contribution: true, cycle: { select: { sequence: true } } },
      }),
      this.prisma.jameyaDue.groupBy({ by: ['jameyaId'], where: memberWhere, _sum: { amount: true, paidAmount: true } }),
      this.prisma.jameyaDue.groupBy({
        by: ['jameyaId'],
        where: { ...memberWhere, ...lateJameyaDueWhere(today) },
        _sum: { amount: true, paidAmount: true },
      }),
      this.prisma.jameyaPayout.groupBy({ by: ['jameyaId'], where: memberWhere, _sum: { amount: true } }),
    ]);

    const remainingByJameya = new Map(dues.map((row) => [row.jameyaId, owedOf(row._sum)]));
    const lateByJameya = new Map(lateDues.map((row) => [row.jameyaId, owedOf(row._sum)]));
    const receivedByJameya = new Map(payouts.map((row) => [row.jameyaId, row._sum.amount ?? 0]));
    const standings = new Map<string, JameyaMemberStanding>();
    for (const share of shares) {
      const standing = standings.get(share.jameyaId);
      if (standing) {
        standing.turnSequences.push(share.cycle.sequence);
        standing.monthlyAmount += share.contribution;
        continue;
      }
      standings.set(share.jameyaId, {
        turnSequences: [share.cycle.sequence],
        monthlyAmount: share.contribution,
        remainingAmount: remainingByJameya.get(share.jameyaId) ?? 0,
        lateAmount: lateByJameya.get(share.jameyaId) ?? 0,
        receivedAmount: receivedByJameya.get(share.jameyaId) ?? 0,
      });
    }
    return standings;
  }

  async findOne(tenantId: string, id: string): Promise<JameyaDetail> {
    const jameya = await this.prisma.jameya.findFirst({ where: { id, tenantId }, include: JAMEYA_DETAIL_INCLUDE });
    if (!jameya) {
      throw new NotFoundException('Jameya not found.');
    }
    return buildJameyaDetail(jameya, getUtcToday());
  }

  async update(tenantId: string, id: string, dto: UpdateJameyaDto): Promise<JameyaDetail> {
    const { count } = await this.prisma.jameya.updateMany({
      where: { id, tenantId },
      data: { name: dto.name, notes: dto.notes },
    });
    if (count === 0) {
      throw new NotFoundException('Jameya not found.');
    }
    return this.findOne(tenantId, id);
  }
}
