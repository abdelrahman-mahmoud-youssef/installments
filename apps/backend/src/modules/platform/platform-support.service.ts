import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSupportQueryDto, SupportReplyState } from './dto/platform-support-query.dto';
import { ReplySupportMessageDto } from './dto/reply-support-message.dto';

const PLATFORM_SUPPORT_MESSAGE_SELECT = {
  id: true,
  subject: true,
  message: true,
  imageUrl: true,
  adminReply: true,
  repliedAt: true,
  createdAt: true,
  userName: true,
  userEmail: true,
  tenant: { select: { id: true, name: true, displayName: true, slug: true } },
} satisfies Prisma.SupportMessageSelect;

type PlatformSupportMessageRow = Prisma.SupportMessageGetPayload<{ select: typeof PLATFORM_SUPPORT_MESSAGE_SELECT }>;

export interface PlatformSupportMessage {
  id: string;
  subject: string;
  message: string;
  imageUrl: string | null;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  sender: { name: string; email: string };
  tenant: { id: string; name: string; slug: string };
}

const AWAITING_REPLY_WHERE: Prisma.SupportMessageWhereInput = { repliedAt: null };

function buildReplyStateWhere(state: SupportReplyState | undefined): Prisma.SupportMessageWhereInput {
  if (state === SupportReplyState.AWAITING_REPLY) {
    return AWAITING_REPLY_WHERE;
  }
  if (state === SupportReplyState.REPLIED) {
    return { repliedAt: { not: null } };
  }
  return {};
}

function toPlatformSupportMessage(row: PlatformSupportMessageRow): PlatformSupportMessage {
  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    imageUrl: row.imageUrl,
    adminReply: row.adminReply,
    repliedAt: row.repliedAt,
    createdAt: row.createdAt,
    sender: { name: row.userName, email: row.userEmail },
    tenant: { id: row.tenant.id, name: row.tenant.displayName ?? row.tenant.name, slug: row.tenant.slug },
  };
}

@Injectable()
export class PlatformSupportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlatformSupportQueryDto): Promise<PaginatedResult<PlatformSupportMessage>> {
    const where = buildReplyStateWhere(query.state);
    const [rows, total] = await Promise.all([
      this.prisma.supportMessage.findMany({
        where,
        select: PLATFORM_SUPPORT_MESSAGE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supportMessage.count({ where }),
    ]);
    return buildPaginatedResult(rows.map(toPlatformSupportMessage), total, query.page, query.limit);
  }

  async countAwaitingReply(): Promise<{ count: number }> {
    return { count: await this.prisma.supportMessage.count({ where: AWAITING_REPLY_WHERE }) };
  }

  async reply(messageId: string, dto: ReplySupportMessageDto): Promise<PlatformSupportMessage> {
    const existing = await this.prisma.supportMessage.findUnique({ where: { id: messageId }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Support message not found.');
    }
    const row = await this.prisma.supportMessage.update({
      where: { id: messageId },
      data: { adminReply: dto.reply, repliedAt: new Date(), seenAt: null },
      select: PLATFORM_SUPPORT_MESSAGE_SELECT,
    });
    return toPlatformSupportMessage(row);
  }
}
