import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentMethodTransaction } from '@prisma/client';
import { MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES } from '../../common/constants';
import { getUtcToday, resolveMonthStart, startOfUtcMonth } from '../../common/date/utc-date';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PaymentMethodLimitService } from './payment-method-limit.service';
import { CreatePaymentMethodTransactionDto } from './dto/create-payment-method-transaction.dto';
import { PaymentMethodTransactionQueryDto } from './dto/payment-method-transaction-query.dto';
import { getPaymentMethodMonthlyUsage, PaymentMethodMonthlyUsage } from './payment-method-usage.util';

@Injectable()
export class PaymentMethodTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limitService: PaymentMethodLimitService,
    private readonly storage: StorageService,
  ) {}

  async create(
    tenantId: string,
    paymentMethodId: string,
    dto: CreatePaymentMethodTransactionDto,
  ): Promise<PaymentMethodTransaction> {
    await this.findOwnedMethod(tenantId, paymentMethodId);

    const receiptUrl = dto.image ? await this.saveReceiptImage(tenantId, dto.image) : undefined;

    const transaction = await this.prisma.paymentMethodTransaction.create({
      data: {
        tenantId,
        paymentMethodId,
        direction: dto.direction,
        amount: dto.amount,
        counterpartyName: dto.counterpartyName,
        counterpartyPhone: dto.counterpartyPhone,
        note: dto.note,
        receiptUrl,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });

    void this.limitService.checkAndAlert(tenantId, paymentMethodId);

    return transaction;
  }

  async findAll(
    tenantId: string,
    paymentMethodId: string,
    query: PaymentMethodTransactionQueryDto,
  ): Promise<PaginatedResult<PaymentMethodTransaction>> {
    await this.findOwnedMethod(tenantId, paymentMethodId);

    const where: Prisma.PaymentMethodTransactionWhereInput = { tenantId, paymentMethodId };
    if (query.month) {
      const monthStart = resolveMonthStart(query.month, getUtcToday());
      where.occurredAt = { gte: monthStart, lt: startOfUtcMonth(monthStart, 1) };
    }

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

  async getMonthlySummary(
    tenantId: string,
    paymentMethodId: string,
    month?: string,
  ): Promise<PaymentMethodMonthlyUsage & { monthlyLimit: number | null }> {
    const method = await this.findOwnedMethod(tenantId, paymentMethodId);
    const monthStart = resolveMonthStart(month, getUtcToday());
    const usage = await getPaymentMethodMonthlyUsage(this.prisma, tenantId, paymentMethodId, monthStart);
    return { ...usage, monthlyLimit: method.monthlyLimit };
  }

  private async saveReceiptImage(tenantId: string, image: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(image, MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`payment-method-transactions/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }

  private async findOwnedMethod(tenantId: string, paymentMethodId: string) {
    const method = await this.prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, tenantId } });
    if (!method) {
      throw new NotFoundException('Payment method not found.');
    }
    return method;
  }
}
