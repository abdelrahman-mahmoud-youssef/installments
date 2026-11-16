import { Injectable, NotFoundException } from '@nestjs/common';
import { PushAudience, PushNotificationKind } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SendPushAnnouncementDto } from './dto/send-push-announcement.dto';
import { buildPushAudienceWhere } from './push-audience-where';
import { PushService } from './push.service';
import { PushRoute } from './push.types';

const PUSH_ANNOUNCEMENT_SELECT = {
  id: true,
  title: true,
  body: true,
  audience: true,
  recipientCount: true,
  createdAt: true,
  tenant: { select: { name: true, displayName: true } },
} as const;

export interface PushAnnouncementSummary {
  id: string;
  title: string;
  body: string;
  audience: PushAudience | null;
  recipientCount: number;
  createdAt: Date;
  shopName: string | null;
}

interface PushAnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: PushAudience | null;
  recipientCount: number;
  createdAt: Date;
  tenant: { name: string; displayName: string | null } | null;
}

function toSummary(row: PushAnnouncementRow): PushAnnouncementSummary {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    recipientCount: row.recipientCount,
    createdAt: row.createdAt,
    shopName: row.tenant ? (row.tenant.displayName ?? row.tenant.name) : null,
  };
}

@Injectable()
export class PushAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async send(dto: SendPushAnnouncementDto): Promise<PushAnnouncementSummary> {
    const tenants = await this.prisma.tenant.findMany({
      where: buildPushAudienceWhere(dto.audience, dto.tenantId, getUtcToday()),
      select: { id: true },
    });
    if (dto.audience === PushAudience.SHOP && tenants.length === 0) {
      throw new NotFoundException('Shop not found.');
    }
    const recipientCount = await this.pushService.sendToTenants(
      tenants.map((tenant) => tenant.id),
      () => ({ title: dto.title, body: dto.body }),
      PushRoute.SUPPORT,
    );
    const row = await this.prisma.pushNotificationLog.create({
      data: {
        kind: PushNotificationKind.ANNOUNCEMENT,
        audience: dto.audience,
        tenantId: dto.audience === PushAudience.SHOP ? dto.tenantId : null,
        title: dto.title,
        body: dto.body,
        recipientCount,
      },
      select: PUSH_ANNOUNCEMENT_SELECT,
    });
    return toSummary(row);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<PushAnnouncementSummary>> {
    const where = { kind: PushNotificationKind.ANNOUNCEMENT };
    const [rows, total] = await Promise.all([
      this.prisma.pushNotificationLog.findMany({
        where,
        select: PUSH_ANNOUNCEMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.pushNotificationLog.count({ where }),
    ]);
    return buildPaginatedResult(rows.map(toSummary), total, query.page, query.limit);
  }
}
