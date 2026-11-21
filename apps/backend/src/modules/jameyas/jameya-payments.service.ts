import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JameyaDueStatus, Prisma } from '@prisma/client';
import { JAMEYA_RECEIPT_IMAGE_MAX_UPLOAD_BYTES } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { allocateOldestFirst } from '../../common/installments/allocation';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateJameyaPaymentDto } from './dto/create-jameya-payment.dto';
import { assertJameyaActive, completeJameyaIfFinished, lockJameya } from './jameya-transaction';

const JAMEYA_PAYMENT_SELECT = {
  id: true,
  jameyaId: true,
  customerId: true,
  amount: true,
  balanceAfter: true,
  paidAt: true,
  note: true,
  receiptUrl: true,
  clientRequestId: true,
  createdAt: true,
  allocations: { select: { dueId: true, amount: true } },
} satisfies Prisma.JameyaPaymentSelect;

export type JameyaPaymentRecord = Prisma.JameyaPaymentGetPayload<{ select: typeof JAMEYA_PAYMENT_SELECT }>;

@Injectable()
export class JameyaPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(tenantId: string, jameyaId: string, dto: CreateJameyaPaymentDto): Promise<JameyaPaymentRecord> {
    const receiptUrl = await this.saveReceiptImage(tenantId, jameyaId, dto);
    const paymentId = await this.prisma.$transaction(async (tx) => {
      const jameya = await lockJameya(tx, tenantId, jameyaId);
      const replayed = await tx.jameyaPayment.findFirst({
        where: { tenantId, jameyaId, clientRequestId: dto.clientRequestId },
        select: { id: true },
      });
      if (replayed) {
        return replayed.id;
      }
      assertJameyaActive(jameya);

      const memberDues = await tx.jameyaDue.findMany({
        where: { jameyaId, customerId: dto.customerId },
        orderBy: { cycle: { sequence: 'asc' } },
        select: { id: true, amount: true, paidAmount: true },
      });
      if (memberDues.length === 0) {
        throw new NotFoundException('This customer is not a member of this jameya.');
      }

      const { allocations, unallocatedAmount } = allocateOldestFirst(dto.amount, memberDues);
      if (unallocatedAmount > 0) {
        throw new BadRequestException('The payment is more than what this member still owes.');
      }

      const owedBefore = memberDues.reduce((total, due) => total + due.amount - due.paidAmount, 0);
      const payment = await tx.jameyaPayment.create({
        data: {
          tenantId,
          jameyaId,
          customerId: dto.customerId,
          amount: dto.amount,
          balanceAfter: owedBefore - dto.amount,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
          note: dto.note,
          receiptUrl,
          clientRequestId: dto.clientRequestId,
        },
      });
      await tx.jameyaPaymentAllocation.createMany({
        data: allocations.map((allocation) => ({
          tenantId,
          paymentId: payment.id,
          dueId: allocation.installmentId,
          amount: allocation.amount,
        })),
      });

      const appliedByDueId = new Map(allocations.map((allocation) => [allocation.installmentId, allocation.amount]));
      for (const due of memberDues) {
        const applied = appliedByDueId.get(due.id);
        if (applied === undefined) {
          continue;
        }
        const paidAmount = due.paidAmount + applied;
        await tx.jameyaDue.update({
          where: { id: due.id },
          data: {
            paidAmount,
            status: paidAmount >= due.amount ? JameyaDueStatus.PAID : JameyaDueStatus.PARTIALLY_PAID,
          },
        });
      }

      await completeJameyaIfFinished(tx, jameya);
      return payment.id;
    });
    return this.prisma.jameyaPayment.findUniqueOrThrow({ where: { id: paymentId }, select: JAMEYA_PAYMENT_SELECT });
  }

  async findAll(
    tenantId: string,
    jameyaId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<JameyaPaymentRecord>> {
    const jameya = await this.prisma.jameya.findFirst({ where: { id: jameyaId, tenantId }, select: { id: true } });
    if (!jameya) {
      throw new NotFoundException('Jameya not found.');
    }
    const where: Prisma.JameyaPaymentWhereInput = { tenantId, jameyaId };

    const [data, total] = await Promise.all([
      this.prisma.jameyaPayment.findMany({
        where,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: JAMEYA_PAYMENT_SELECT,
      }),
      this.prisma.jameyaPayment.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  private async saveReceiptImage(
    tenantId: string,
    jameyaId: string,
    dto: CreateJameyaPaymentDto,
  ): Promise<string | undefined> {
    if (!dto.image) {
      return undefined;
    }
    const replayed = await this.prisma.jameyaPayment.findFirst({
      where: { tenantId, jameyaId, clientRequestId: dto.clientRequestId },
      select: { id: true },
    });
    if (replayed) {
      return undefined;
    }
    const { buffer, extension } = decodeImageUpload(dto.image, JAMEYA_RECEIPT_IMAGE_MAX_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`jameya-payments/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }
}
