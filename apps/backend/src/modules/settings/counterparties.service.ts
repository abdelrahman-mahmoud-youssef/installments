import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Counterparty, CounterpartyAdjustment, PaymentDirection, Prisma } from '@prisma/client';
import { getUtcToday, resolveMonthStart, startOfUtcMonth } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterpartyHistoryQueryDto } from './dto/counterparty-history-query.dto';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';
import { CreateCounterpartyAdjustmentDto } from './dto/create-counterparty-adjustment.dto';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';

const IN_USE_ERROR = 'This contact has transaction or adjustment history and can’t be deleted.';

export type CounterpartyWithBalance = Counterparty & { balance: number };

export interface CounterpartyHistoryItem {
  kind: 'TRANSACTION' | 'ADJUSTMENT';
  id: string;
  direction: PaymentDirection;
  amount: number;
  note: string | null;
  occurredAt: Date;
  receiptUrl: string | null;
  paymentMethodLabel: string | null;
}

export type CounterpartyHistoryResult = PaginatedResult<CounterpartyHistoryItem> & {
  totalIn: number;
  totalOut: number;
};

@Injectable()
export class CounterpartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCounterpartyDto): Promise<Counterparty> {
    return this.prisma.counterparty.create({
      data: { tenantId, name: dto.name, phone: dto.phone, notes: dto.notes },
    });
  }

  async findAll(tenantId: string, query: CounterpartyQueryDto): Promise<PaginatedResult<CounterpartyWithBalance>> {
    const where: Prisma.CounterpartyWhereInput = {
      tenantId,
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.counterparty.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.counterparty.count({ where }),
    ]);

    const balances = await this.getBalances(
      tenantId,
      data.map((counterparty) => counterparty.id),
    );
    const withBalance = data.map((counterparty) => ({
      ...counterparty,
      balance: balances.get(counterparty.id) ?? 0,
    }));

    return buildPaginatedResult(withBalance, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string): Promise<CounterpartyWithBalance> {
    const counterparty = await this.findOwned(tenantId, id);
    const balances = await this.getBalances(tenantId, [id]);
    return { ...counterparty, balance: balances.get(id) ?? 0 };
  }

  async update(tenantId: string, id: string, dto: UpdateCounterpartyDto): Promise<Counterparty> {
    await this.findOwned(tenantId, id);
    return this.prisma.counterparty.update({
      where: { id },
      data: { name: dto.name, phone: dto.phone, notes: dto.notes },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    try {
      await this.prisma.counterparty.delete({ where: { id } });
    } catch (error) {
      if (this.isForeignKeyRestrictionError(error)) {
        throw new BadRequestException(IN_USE_ERROR);
      }
      throw error;
    }
  }

  async createAdjustment(
    tenantId: string,
    counterpartyId: string,
    dto: CreateCounterpartyAdjustmentDto,
  ): Promise<CounterpartyAdjustment> {
    await this.findOwned(tenantId, counterpartyId);
    return this.prisma.counterpartyAdjustment.create({
      data: {
        tenantId,
        counterpartyId,
        direction: dto.direction,
        amount: dto.amount,
        note: dto.note,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });
  }

  async getHistory(
    tenantId: string,
    counterpartyId: string,
    query: CounterpartyHistoryQueryDto,
  ): Promise<CounterpartyHistoryResult> {
    await this.findOwned(tenantId, counterpartyId);

    const occurredAt = query.month
      ? (() => {
          const monthStart = resolveMonthStart(query.month, getUtcToday());
          return { gte: monthStart, lt: startOfUtcMonth(monthStart, 1) };
        })()
      : undefined;

    const [transactions, adjustments] = await Promise.all([
      this.prisma.paymentMethodTransaction.findMany({
        where: { tenantId, counterpartyId, ...(occurredAt && { occurredAt }) },
        include: { paymentMethod: { select: { label: true } } },
      }),
      this.prisma.counterpartyAdjustment.findMany({
        where: { tenantId, counterpartyId, ...(occurredAt && { occurredAt }) },
      }),
    ]);

    const items: CounterpartyHistoryItem[] = [
      ...transactions.map(
        (transaction): CounterpartyHistoryItem => ({
          kind: 'TRANSACTION',
          id: transaction.id,
          direction: transaction.direction,
          amount: transaction.amount,
          note: transaction.note,
          occurredAt: transaction.occurredAt,
          receiptUrl: transaction.receiptUrl,
          paymentMethodLabel: transaction.paymentMethod.label,
        }),
      ),
      ...adjustments.map(
        (adjustment): CounterpartyHistoryItem => ({
          kind: 'ADJUSTMENT',
          id: adjustment.id,
          direction: adjustment.direction,
          amount: adjustment.amount,
          note: adjustment.note,
          occurredAt: adjustment.occurredAt,
          receiptUrl: null,
          paymentMethodLabel: null,
        }),
      ),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    const totalIn = items.filter((item) => item.direction === 'IN').reduce((sum, item) => sum + item.amount, 0);
    const totalOut = items.filter((item) => item.direction === 'OUT').reduce((sum, item) => sum + item.amount, 0);

    const start = (query.page - 1) * query.limit;
    const data = items.slice(start, start + query.limit);

    return { ...buildPaginatedResult(data, items.length, query.page, query.limit), totalIn, totalOut };
  }

  private async getBalances(tenantId: string, counterpartyIds: string[]): Promise<Map<string, number>> {
    if (counterpartyIds.length === 0) {
      return new Map();
    }

    const [transactionSums, adjustmentSums] = await Promise.all([
      this.prisma.paymentMethodTransaction.groupBy({
        by: ['counterpartyId', 'direction'],
        where: { tenantId, counterpartyId: { in: counterpartyIds } },
        _sum: { amount: true },
      }),
      this.prisma.counterpartyAdjustment.groupBy({
        by: ['counterpartyId', 'direction'],
        where: { tenantId, counterpartyId: { in: counterpartyIds } },
        _sum: { amount: true },
      }),
    ]);

    const balances = new Map<string, number>();
    for (const row of [...transactionSums, ...adjustmentSums]) {
      if (!row.counterpartyId) {
        continue;
      }
      const signedAmount = (row._sum.amount ?? 0) * (row.direction === 'OUT' ? 1 : -1);
      balances.set(row.counterpartyId, (balances.get(row.counterpartyId) ?? 0) + signedAmount);
    }
    return balances;
  }

  private async findOwned(tenantId: string, id: string): Promise<Counterparty> {
    const counterparty = await this.prisma.counterparty.findFirst({ where: { id, tenantId } });
    if (!counterparty) {
      throw new NotFoundException('Contact not found.');
    }
    return counterparty;
  }

  private isForeignKeyRestrictionError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return true;
    }
    return error instanceof Prisma.PrismaClientUnknownRequestError && /foreign key constraint/i.test(error.message);
  }
}
