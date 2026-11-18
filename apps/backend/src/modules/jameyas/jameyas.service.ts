import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerStatus, Prisma } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJameyaDto } from './dto/create-jameya.dto';
import { JameyaQueryDto } from './dto/jameya-query.dto';
import { UpdateJameyaDto } from './dto/update-jameya.dto';
import { calculatePot, HALVES_PER_SHARE } from './jameya-amounts';
import { buildJameyaDetail, JAMEYA_DETAIL_INCLUDE, JameyaDetail } from './jameya-detail';
import { lateJameyaDueWhere } from './jameya-due-where';
import { buildJameyaSchedule } from './jameya-schedule';

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

export type JameyaListItem = Omit<JameyaListRow, 'cycles' | '_count'> & {
  potAmount: number;
  nextCycle: JameyaListRow['cycles'][number] | null;
  lateDueCount: number;
};

@Injectable()
export class JameyasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateJameyaDto): Promise<JameyaDetail> {
    const memberCount = await this.prisma.customer.count({
      where: { id: { in: dto.customerIds }, tenantId, status: CustomerStatus.ACTIVE },
    });
    if (memberCount !== dto.customerIds.length) {
      throw new NotFoundException('Customer not found.');
    }

    const firstDueDate = new Date(dto.firstDueDate);
    const schedule = buildJameyaSchedule({
      shareAmount: dto.shareAmount,
      recurrenceType: dto.recurrenceType,
      firstDueDate,
      graceDays: dto.graceDays,
      turns: dto.customerIds.map((customerId) => [{ customerId, halves: HALVES_PER_SHARE }]),
    });

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
            halves: holder.halves,
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

    const data = rows.map(({ cycles, _count, ...jameya }) => ({
      ...jameya,
      potAmount: calculatePot(jameya.shareAmount, jameya.shareCount),
      nextCycle: cycles[0] ?? null,
      lateDueCount: _count.dues,
    }));
    return buildPaginatedResult(data, total, query.page, query.limit);
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
