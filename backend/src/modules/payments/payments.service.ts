import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContractStatus, InstallmentStatus, Prisma } from '@prisma/client';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { allocateManually, allocateOldestFirst, AllocationResult } from './allocation';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

type PaymentDetail = Prisma.PaymentGetPayload<{ include: { allocations: true } }>;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createPaymentDto: CreatePaymentDto): Promise<PaymentDetail> {
    const contract = await this.prisma.contract.findFirst({
      where: { id: createPaymentDto.contractId, tenantId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }

    const paymentId = await this.prisma.$transaction(async (tx) => {
      const outstandingInstallments = await tx.installment.findMany({
        where: {
          contractId: createPaymentDto.contractId,
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
        },
        orderBy: { sequence: 'asc' },
      });

      const allocationResult = this.resolveAllocation(createPaymentDto, outstandingInstallments);

      const payment = await tx.payment.create({
        data: {
          tenantId,
          contractId: createPaymentDto.contractId,
          amount: createPaymentDto.amount,
          paidAt: createPaymentDto.paidAt ? new Date(createPaymentDto.paidAt) : undefined,
          note: createPaymentDto.note,
        },
      });

      await tx.paymentAllocation.createMany({
        data: allocationResult.allocations.map((allocation) => ({
          paymentId: payment.id,
          installmentId: allocation.installmentId,
          amount: allocation.amount,
        })),
      });

      for (const allocation of allocationResult.allocations) {
        const installment = outstandingInstallments.find((item) => item.id === allocation.installmentId);
        if (!installment) {
          continue;
        }
        const newPaidAmount = installment.paidAmount + allocation.amount;
        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: newPaidAmount,
            status:
              newPaidAmount >= installment.amount
                ? InstallmentStatus.PAID
                : InstallmentStatus.PARTIALLY_PAID,
          },
        });
      }

      const remainingCount = await tx.installment.count({
        where: {
          contractId: createPaymentDto.contractId,
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
        },
      });
      if (remainingCount === 0) {
        await tx.contract.update({
          where: { id: createPaymentDto.contractId },
          data: { status: ContractStatus.COMPLETED },
        });
      }

      return payment.id;
    });

    return this.findOne(tenantId, paymentId);
  }

  async findAll(tenantId: string, query: PaymentQueryDto): Promise<PaginatedResult<PaymentDetail>> {
    const where: Prisma.PaymentWhereInput = { tenantId, contractId: query.contractId };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { allocations: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  private async findOne(tenantId: string, id: string): Promise<PaymentDetail> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: { allocations: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return payment;
  }

  private resolveAllocation(
    createPaymentDto: CreatePaymentDto,
    outstandingInstallmentsOldestFirst: { id: string; amount: number; paidAmount: number }[],
  ): AllocationResult {
    try {
      if (createPaymentDto.allocations && createPaymentDto.allocations.length > 0) {
        return allocateManually(
          createPaymentDto.amount,
          createPaymentDto.allocations,
          outstandingInstallmentsOldestFirst,
        );
      }
      return allocateOldestFirst(createPaymentDto.amount, outstandingInstallmentsOldestFirst);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid payment allocation.');
    }
  }
}
