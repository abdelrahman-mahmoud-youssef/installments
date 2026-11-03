import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthenticatedPlatformAdmin } from '../../common/decorators/current-platform-admin.decorator';
import { SUBSCRIPTION_MONTHLY_PRICE } from '../../common/constants';
import { getUtcToday } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { buildActiveSubscriptionWhere } from '../../common/subscription/active-subscription-where';
import {
  calculateNextSubscriptionPeriod,
  resolveSubscriptionStatus,
  SubscriptionStatus,
} from '../../common/subscription/subscription';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformTenantQueryDto } from './dto/platform-tenant-query.dto';
import { PlatformTenantSubscriptionQueryDto } from './dto/platform-tenant-subscription-query.dto';
import { buildSubscriptionStatusWhere, buildTenantSearchWhere } from './platform-tenant-where';

const TENANT_SUMMARY_SELECT = {
  id: true,
  name: true,
  displayName: true,
  slug: true,
  phone: true,
  createdAt: true,
  subscriptionExpiresOn: true,
  users: {
    where: { role: Role.ADMIN },
    orderBy: { createdAt: 'asc' },
    take: 1,
    select: { name: true, email: true },
  },
  _count: { select: { subscriptions: true } },
} satisfies Prisma.TenantSelect;

type TenantSummaryRow = Prisma.TenantGetPayload<{ select: typeof TENANT_SUMMARY_SELECT }>;

export interface PlatformTenantOwner {
  name: string;
  email: string;
}

export interface PlatformTenantSummary {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  createdAt: Date;
  subscriptionExpiresOn: Date;
  subscriptionStatus: SubscriptionStatus;
  owner: PlatformTenantOwner | null;
}

export interface PlatformTenantSubscriptionRecord {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  amount: number;
  createdAt: Date;
  activatedBy: { name: string } | null;
}

@Injectable()
export class PlatformTenantsService {
  private readonly logger = new Logger(PlatformTenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlatformTenantQueryDto): Promise<PaginatedResult<PlatformTenantSummary>> {
    const today = getUtcToday();
    const where: Prisma.TenantWhereInput = {
      AND: [
        query.q ? buildTenantSearchWhere(query.q) : {},
        query.status ? buildSubscriptionStatusWhere(query.status, today) : {},
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        select: TENANT_SUMMARY_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => this.toSummary(row, today)),
      total,
      query.page,
      query.limit,
    );
  }

  async activate(admin: AuthenticatedPlatformAdmin, tenantId: string): Promise<PlatformTenantSummary> {
    await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionExpiresOn: true },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found.');
      }

      const period = calculateNextSubscriptionPeriod(tenant.subscriptionExpiresOn, getUtcToday());
      const { count } = await tx.tenant.updateMany({
        where: { id: tenantId, subscriptionExpiresOn: tenant.subscriptionExpiresOn },
        data: { subscriptionExpiresOn: period.periodEnd },
      });
      if (count === 0) {
        throw new ConflictException('This shop was updated at the same time. Refresh and try again.');
      }

      await tx.tenantSubscription.create({
        data: {
          tenantId,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          amount: SUBSCRIPTION_MONTHLY_PRICE,
          activatedById: admin.platformAdminId,
        },
      });
    });

    this.logger.log(`Platform admin ${admin.email} activated a month for tenant ${tenantId}`);
    return this.findSummary(tenantId);
  }

  async deactivate(admin: AuthenticatedPlatformAdmin, tenantId: string): Promise<PlatformTenantSummary> {
    const today = getUtcToday();
    await this.prisma.tenant.updateMany({
      where: { id: tenantId, ...buildActiveSubscriptionWhere(today) },
      data: { subscriptionExpiresOn: today },
    });

    this.logger.log(`Platform admin ${admin.email} deactivated tenant ${tenantId}`);
    return this.findSummary(tenantId);
  }

  async findSubscriptions(
    tenantId: string,
    query: PlatformTenantSubscriptionQueryDto,
  ): Promise<PaginatedResult<PlatformTenantSubscriptionRecord>> {
    await this.findSummary(tenantId);
    const where: Prisma.TenantSubscriptionWhereInput = { tenantId };

    const [records, total] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where,
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          amount: true,
          createdAt: true,
          activatedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenantSubscription.count({ where }),
    ]);

    return buildPaginatedResult(records, total, query.page, query.limit);
  }

  private async findSummary(tenantId: string): Promise<PlatformTenantSummary> {
    const row = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: TENANT_SUMMARY_SELECT });
    if (!row) {
      throw new NotFoundException('Tenant not found.');
    }
    return this.toSummary(row, getUtcToday());
  }

  private toSummary(row: TenantSummaryRow, today: Date): PlatformTenantSummary {
    return {
      id: row.id,
      name: row.displayName ?? row.name,
      slug: row.slug,
      phone: row.phone,
      createdAt: row.createdAt,
      subscriptionExpiresOn: row.subscriptionExpiresOn,
      subscriptionStatus: resolveSubscriptionStatus(
        { expiresOn: row.subscriptionExpiresOn, hasPaidPeriod: row._count.subscriptions > 0 },
        today,
      ),
      owner: row.users[0] ?? null,
    };
  }
}
