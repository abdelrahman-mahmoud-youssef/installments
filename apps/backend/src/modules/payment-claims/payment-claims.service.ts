import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentStatus, Prisma, PaymentClaimStatus } from '@prisma/client';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { DeclineClaimDto } from './dto/decline-claim.dto';
import { PaymentClaimQueryDto } from './dto/payment-claim-query.dto';

const CLAIM_INCLUDE = {
  contract: { select: { productName: true, customer: { select: { name: true } } } },
  installment: { select: { sequence: true, dueDate: true, status: true } },
  paymentMethod: { select: { label: true, details: true } },
} satisfies Prisma.PaymentClaimInclude;

type PaymentClaimDetail = Prisma.PaymentClaimGetPayload<{ include: typeof CLAIM_INCLUDE }>;

@Injectable()
export class PaymentClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async findAll(
    tenantId: string,
    query: PaymentClaimQueryDto,
  ): Promise<PaginatedResult<PaymentClaimDetail>> {
    const where: Prisma.PaymentClaimWhereInput = { tenantId, status: query.status };

    const [data, total] = await Promise.all([
      this.prisma.paymentClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: CLAIM_INCLUDE,
      }),
      this.prisma.paymentClaim.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async approve(tenantId: string, reviewerUserId: string, id: string): Promise<PaymentClaimDetail> {
    const claim = await this.findOwned(tenantId, id);
    if (claim.status !== PaymentClaimStatus.PENDING) {
      throw new BadRequestException('This claim has already been reviewed.');
    }
    if (
      claim.installment.status !== InstallmentStatus.PENDING &&
      claim.installment.status !== InstallmentStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException('This installment has already been settled through another payment.');
    }

    await this.paymentsService.create(tenantId, {
      contractId: claim.contractId,
      amount: claim.amount,
      allocations: [{ installmentId: claim.installmentId, amount: claim.amount }],
      note: `Approved payment claim #${claim.id}`,
    });

    await this.prisma.paymentClaim.update({
      where: { id: claim.id },
      data: {
        status: PaymentClaimStatus.APPROVED,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
      },
    });

    return this.findOwned(tenantId, id);
  }

  async decline(
    tenantId: string,
    reviewerUserId: string,
    id: string,
    dto: DeclineClaimDto,
  ): Promise<PaymentClaimDetail> {
    const claim = await this.findOwned(tenantId, id);
    if (claim.status !== PaymentClaimStatus.PENDING) {
      throw new BadRequestException('This claim has already been reviewed.');
    }

    await this.prisma.paymentClaim.update({
      where: { id: claim.id },
      data: {
        status: PaymentClaimStatus.DECLINED,
        declineReason: dto.reason,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
      },
    });

    return this.findOwned(tenantId, id);
  }

  private async findOwned(tenantId: string, id: string): Promise<PaymentClaimDetail> {
    const claim = await this.prisma.paymentClaim.findFirst({
      where: { id, tenantId },
      include: CLAIM_INCLUDE,
    });
    if (!claim) {
      throw new NotFoundException('Payment claim not found.');
    }
    return claim;
  }
}
