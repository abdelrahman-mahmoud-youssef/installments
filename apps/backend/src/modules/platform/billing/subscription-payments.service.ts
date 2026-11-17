import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toUtcMidnight } from '../../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { buildTenantSearchWhere } from '../platform-tenant-where';
import { PlatformPaymentQueryDto } from './dto/platform-payment-query.dto';
import { SUBSCRIPTION_RECORD_SELECT, SubscriptionRecord } from './subscription-record';

const PAYMENT_SELECT = {
  ...SUBSCRIPTION_RECORD_SELECT,
  tenant: { select: { id: true, name: true, displayName: true, slug: true } },
} satisfies Prisma.TenantSubscriptionSelect;

export type PlatformPayment = SubscriptionRecord & { tenant: { id: string; name: string; slug: string } };

export interface PlatformPaymentTotals {
  amount: number;
  discount: number;
}

export type PlatformPaymentListResult = PaginatedResult<PlatformPayment> & { totals: PlatformPaymentTotals };

function toDate(isoDate: string): Date {
  return toUtcMidnight(new Date(isoDate));
}

function buildPaymentWhere(query: PlatformPaymentQueryDto): Prisma.TenantSubscriptionWhereInput {
  return {
    ...((query.from || query.to) && {
      paidAt: {
        ...(query.from && { gte: toDate(query.from) }),
        ...(query.to && { lte: toDate(query.to) }),
      },
    }),
    source: query.source,
    planId: query.planId,
    offerId: query.offerId,
    paymentMethod: query.paymentMethod,
    ...(query.q && { tenant: buildTenantSearchWhere(query.q) }),
  };
}

@Injectable()
export class SubscriptionPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlatformPaymentQueryDto): Promise<PlatformPaymentListResult> {
    const where = buildPaymentWhere(query);

    const [rows, total, sums] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where,
        select: PAYMENT_SELECT,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenantSubscription.count({ where }),
      this.prisma.tenantSubscription.aggregate({ where, _sum: { amount: true, listPrice: true } }),
    ]);

    const amount = sums._sum.amount ?? 0;
    const payments = rows.map(({ tenant, ...record }) => ({
      ...record,
      tenant: { id: tenant.id, name: tenant.displayName ?? tenant.name, slug: tenant.slug },
    }));

    return {
      ...buildPaginatedResult(payments, total, query.page, query.limit),
      totals: { amount, discount: (sums._sum.listPrice ?? 0) - amount },
    };
  }
}
