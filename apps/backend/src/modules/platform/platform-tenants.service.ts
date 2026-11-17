import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthenticatedPlatformAdmin } from '../../common/decorators/current-platform-admin.decorator';
import { getUtcToday } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { buildActiveSubscriptionWhere } from '../../common/subscription/active-subscription-where';
import { resolveSubscriptionStatus, SubscriptionStatus } from '../../common/subscription/subscription';
import { PrismaService } from '../../prisma/prisma.service';
import { toActivationItem, toPaymentDetails } from './billing/activation-request';
import { SubscriptionActivationService } from './billing/subscription-activation.service';
import { SUBSCRIPTION_RECORD_SELECT, SubscriptionRecord } from './billing/subscription-record';
import { ActivateTenantDto } from './dto/activate-tenant.dto';
import { PlatformTenantQueryDto } from './dto/platform-tenant-query.dto';
import { PlatformTenantSubscriptionQueryDto } from './dto/platform-tenant-subscription-query.dto';
import { buildTenantFilterWhere, buildTenantSearchWhere } from './platform-tenant-where';

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
  referredBy: { select: { name: true, displayName: true, slug: true } },
  subscriptions: {
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    take: 1,
    select: {
      paidAt: true,
      months: true,
      amount: true,
      source: true,
      plan: { select: { nameEn: true, nameAr: true } },
      offer: { select: { nameEn: true, nameAr: true } },
    },
  },
  _count: { select: { subscriptions: true, referrals: true } },
} satisfies Prisma.TenantSelect;

type TenantSummaryRow = Prisma.TenantGetPayload<{ select: typeof TENANT_SUMMARY_SELECT }>;

export interface PlatformTenantOwner {
  name: string;
  email: string;
}

export interface PlatformTenantReferrer {
  name: string;
  slug: string;
}

export type PlatformTenantLastPayment = TenantSummaryRow['subscriptions'][number];

export interface PlatformTenantSummary {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  createdAt: Date;
  subscriptionExpiresOn: Date;
  subscriptionStatus: SubscriptionStatus;
  owner: PlatformTenantOwner | null;
  referredBy: PlatformTenantReferrer | null;
  invitedShopsCount: number;
  lastPayment: PlatformTenantLastPayment | null;
}


@Injectable()
export class PlatformTenantsService {
  private readonly logger = new Logger(PlatformTenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activation: SubscriptionActivationService,
  ) {}

  async findAll(query: PlatformTenantQueryDto): Promise<PaginatedResult<PlatformTenantSummary>> {
    const today = getUtcToday();
    const where: Prisma.TenantWhereInput = {
      AND: [
        query.q ? buildTenantSearchWhere(query.q) : {},
        query.status ? buildTenantFilterWhere(query.status, today) : {},
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

  async activate(
    admin: AuthenticatedPlatformAdmin,
    tenantId: string,
    dto: ActivateTenantDto,
  ): Promise<PlatformTenantSummary> {
    const subscription = await this.activation.activate(
      tenantId,
      toActivationItem(dto),
      toPaymentDetails(dto, getUtcToday()),
      admin.platformAdminId,
    );

    this.logger.log(
      `Platform admin ${admin.email} activated ${subscription.months} month(s) (${subscription.source}) for tenant ${tenantId}`,
    );
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
  ): Promise<PaginatedResult<SubscriptionRecord>> {
    await this.findSummary(tenantId);
    const where: Prisma.TenantSubscriptionWhereInput = { tenantId };

    const [records, total] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where,
        select: SUBSCRIPTION_RECORD_SELECT,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
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
      referredBy: row.referredBy
        ? { name: row.referredBy.displayName ?? row.referredBy.name, slug: row.referredBy.slug }
        : null,
      invitedShopsCount: row._count.referrals,
      lastPayment: row.subscriptions[0] ?? null,
    };
  }
}
