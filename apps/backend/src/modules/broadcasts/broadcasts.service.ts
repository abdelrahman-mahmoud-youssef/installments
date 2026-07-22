import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Broadcast, BroadcastAudience, BroadcastRecipientStatus, BroadcastStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { SubscriberQueryDto } from './dto/subscriber-query.dto';

const BROADCASTS_QUEUE = 'broadcasts';
const SEND_BROADCAST_JOB = 'send-broadcast';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CAPTION_LIMIT = 1024;
const SEND_DELAY_MS = 50;
const EMPTY_COUNTS: BroadcastCounts = { pending: 0, sent: 0, failed: 0, total: 0 };

export interface BroadcastSubscriber {
  id: string;
  name: string;
  telegramNotificationsEnabled: boolean;
  telegramBroadcastsEnabled: boolean;
}

export interface BroadcastCounts {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

export type BroadcastWithCounts = Broadcast & { counts: BroadcastCounts };

export type CreatedBroadcast = Broadcast & { recipientCount: number };

export interface SendBroadcastJob {
  broadcastId: string;
  image: string | null;
}

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name);

  constructor(
    @InjectQueue(BROADCASTS_QUEUE) private readonly broadcastsQueue: Queue<SendBroadcastJob>,
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async listSubscribers(
    tenantId: string,
    query: SubscriberQueryDto,
  ): Promise<PaginatedResult<BroadcastSubscriber>> {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      telegramChatId: { not: null },
      ...(query.q && { name: { contains: query.q, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          name: true,
          telegramNotificationsEnabled: true,
          telegramBroadcastsEnabled: true,
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async listBroadcasts(
    tenantId: string,
    query: SubscriberQueryDto,
  ): Promise<PaginatedResult<BroadcastWithCounts>> {
    const where: Prisma.BroadcastWhereInput = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.broadcast.count({ where }),
    ]);

    const counts = await this.countsByBroadcastId(data.map((broadcast) => broadcast.id));
    const withCounts = data.map((broadcast) => ({
      ...broadcast,
      counts: counts.get(broadcast.id) ?? EMPTY_COUNTS,
    }));

    return buildPaginatedResult(withCounts, total, query.page, query.limit);
  }

  async createBroadcast(tenantId: string, dto: CreateBroadcastDto): Promise<CreatedBroadcast> {
    const body = dto.body.trim();
    const hasImage = Boolean(dto.image);
    if (!body && !hasImage) {
      throw new BadRequestException('Provide a message or an image.');
    }
    if (hasImage && Buffer.from(dto.image as string, 'base64').byteLength > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image is too large. The maximum size is 5 MB.');
    }

    const recipients = await this.prisma.customer.findMany({
      where: this.recipientWhere(tenantId, dto.audience, dto.customerIds ?? []),
      select: { id: true },
    });

    const broadcast = await this.prisma.$transaction(async (tx) => {
      const created = await tx.broadcast.create({
        data: { tenantId, body, hasImage, audience: dto.audience, status: BroadcastStatus.QUEUED },
      });
      await tx.broadcastRecipient.createMany({
        data: recipients.map((recipient) => ({
          tenantId,
          broadcastId: created.id,
          customerId: recipient.id,
        })),
      });
      return created;
    });

    await this.broadcastsQueue.add(
      SEND_BROADCAST_JOB,
      { broadcastId: broadcast.id, image: dto.image ?? null },
      { removeOnComplete: true, removeOnFail: 100 },
    );

    return { ...broadcast, recipientCount: recipients.length };
  }

  async processBroadcast(broadcastId: string, image: string | null): Promise<void> {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast) {
      return;
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: broadcast.tenantId } });

    if (!tenant.telegramBotToken) {
      await this.prisma.broadcastRecipient.updateMany({
        where: { broadcastId, status: BroadcastRecipientStatus.PENDING },
        data: { status: BroadcastRecipientStatus.FAILED, error: 'Telegram is not connected for this shop.' },
      });
      await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: BroadcastStatus.DONE } });
      return;
    }

    await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: BroadcastStatus.SENDING } });

    const pendingRecipients = await this.prisma.broadcastRecipient.findMany({
      where: { broadcastId, status: BroadcastRecipientStatus.PENDING },
      select: { id: true, customer: { select: { telegramChatId: true } } },
    });

    const imageBuffer = image ? Buffer.from(image, 'base64') : null;
    let fileId: string | null = null;

    for (const recipient of pendingRecipients) {
      const chatId = recipient.customer.telegramChatId as string;
      try {
        fileId = await this.sendToRecipient(tenant.telegramBotToken, chatId, broadcast.body, imageBuffer, fileId);
        await this.prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: BroadcastRecipientStatus.SENT, sentAt: new Date() },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await this.prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: BroadcastRecipientStatus.FAILED, error: message },
        });
        this.logger.error(`Broadcast ${broadcastId} failed for recipient ${recipient.id}: ${message}`);
      }
      await this.sleep(SEND_DELAY_MS);
    }

    await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: BroadcastStatus.DONE } });
  }

  private async sendToRecipient(
    botToken: string,
    chatId: string,
    body: string,
    imageBuffer: Buffer | null,
    fileId: string | null,
  ): Promise<string | null> {
    if (!imageBuffer) {
      await this.telegram.sendMessage(botToken, chatId, body);
      return fileId;
    }

    const caption = body.length > 0 && body.length <= CAPTION_LIMIT ? body : undefined;
    let nextFileId = fileId;
    if (fileId) {
      await this.telegram.sendPhotoByFileId(botToken, chatId, fileId, caption);
    } else {
      nextFileId = await this.telegram.sendPhoto(botToken, chatId, imageBuffer, caption);
    }

    if (body.length > CAPTION_LIMIT) {
      await this.telegram.sendMessage(botToken, chatId, body);
    }
    return nextFileId;
  }

  private recipientWhere(
    tenantId: string,
    audience: BroadcastAudience,
    targetCustomerIds: string[],
  ): Prisma.CustomerWhereInput {
    return {
      tenantId,
      telegramChatId: { not: null },
      telegramBroadcastsEnabled: true,
      ...(audience === BroadcastAudience.SELECTED ? { id: { in: targetCustomerIds } } : {}),
    };
  }

  private async countsByBroadcastId(broadcastIds: string[]): Promise<Map<string, BroadcastCounts>> {
    if (broadcastIds.length === 0) {
      return new Map();
    }
    const grouped = await this.prisma.broadcastRecipient.groupBy({
      by: ['broadcastId', 'status'],
      where: { broadcastId: { in: broadcastIds } },
      _count: true,
    });

    const counts = new Map<string, BroadcastCounts>();
    for (const row of grouped) {
      const current = counts.get(row.broadcastId) ?? { pending: 0, sent: 0, failed: 0, total: 0 };
      if (row.status === BroadcastRecipientStatus.PENDING) {
        current.pending += row._count;
      } else if (row.status === BroadcastRecipientStatus.SENT) {
        current.sent += row._count;
      } else if (row.status === BroadcastRecipientStatus.FAILED) {
        current.failed += row._count;
      }
      current.total += row._count;
      counts.set(row.broadcastId, current);
    }
    return counts;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
