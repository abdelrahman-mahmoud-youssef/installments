import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethodTransaction } from '@prisma/client';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethodLimitService } from './payment-method-limit.service';
import { CreatePaymentMethodTransactionDto } from './dto/create-payment-method-transaction.dto';

@Injectable()
export class PaymentMethodTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limitService: PaymentMethodLimitService,
  ) {}

  async create(
    tenantId: string,
    paymentMethodId: string,
    dto: CreatePaymentMethodTransactionDto,
  ): Promise<PaymentMethodTransaction> {
    await this.findOwnedMethod(tenantId, paymentMethodId);

    const transaction = await this.prisma.paymentMethodTransaction.create({
      data: {
        tenantId,
        paymentMethodId,
        direction: dto.direction,
        amount: dto.amount,
        note: dto.note,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });

    void this.limitService.checkAndAlert(tenantId, paymentMethodId);

    return transaction;
  }

  async findAll(
    tenantId: string,
    paymentMethodId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PaymentMethodTransaction>> {
    await this.findOwnedMethod(tenantId, paymentMethodId);

    const where = { tenantId, paymentMethodId };
    const [data, total] = await Promise.all([
      this.prisma.paymentMethodTransaction.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.paymentMethodTransaction.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  private async findOwnedMethod(tenantId: string, paymentMethodId: string): Promise<void> {
    const method = await this.prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, tenantId } });
    if (!method) {
      throw new NotFoundException('Payment method not found.');
    }
  }
}
