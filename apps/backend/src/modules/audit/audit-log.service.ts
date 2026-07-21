import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PaginatedResult, buildPaginatedResult } from '../../common/pagination/paginated-result.interface';

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    tenantId: string,
    actor: AuditActor,
    action: string,
    entityType: string,
    entityId: string | null,
  ): Promise<void> {
    return this.prisma.auditLog
      .create({
        data: {
          tenantId,
          userId: actor.id,
          userName: actor.name,
          userEmail: actor.email,
          action,
          entityType,
          entityId,
        },
      })
      .then(() => undefined);
  }

  async findAll(tenantId: string, query: AuditLogQueryDto): Promise<PaginatedResult<Prisma.AuditLogGetPayload<object>>> {
    const where: Prisma.AuditLogWhereInput = { tenantId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }
}
