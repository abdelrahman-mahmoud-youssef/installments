import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Broadcast, BroadcastAudience, BroadcastStatus, Prisma } from '@prisma/client';
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

export interface BroadcastSubscriber {
  id: string;
  name: string;
  telegramNotificationsEnabled: boolean;
  telegramBroadcastsEnabled: boolean;
}

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

  async listBroadcasts(tenantId: string, query: SubscriberQueryDto): Promise<PaginatedResult<Broadcast>> {
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
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async createBroadcast(tenantId: string, dto: CreateBroadcastDto): Promise<Broadcast> {
    const body = dto.body.trim();
    const hasImage = Boolean(dto.image);
    if (!body && !hasImage) {
      throw new BadRequestException('Provide a message or an image.');
    }
    if (hasImage && Buffer.from(dto.image as string, 'base64').byteLength > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image is too large. The maximum size is 5 MB.');
    }

    const targetCustomerIds = dto.audience === BroadcastAudience.SELECTED ? (dto.customerIds ?? []) : [];
    const recipientCount = await this.prisma.customer.count({
      where: this.recipientWhere(tenantId, dto.audience, targetCustomerIds),
    });

    const broadcast = await this.prisma.broadcast.create({
      data: {
        tenantId,
        body,
        hasImage,
        audience: dto.audience,
        targetCustomerIds,
        recipientCount,
        status: BroadcastStatus.QUEUED,
      },
    });

    await this.broadcastsQueue.add(
      SEND_BROADCAST_JOB,
      { broadcastId: broadcast.id, image: dto.image ?? null },
      { removeOnComplete: true, removeOnFail: 100 },
    );

    return broadcast;
  }

  async processBroadcast(broadcastId: string, image: string | null): Promise<void> {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast) {
      return;
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: broadcast.tenantId } });
    if (!tenant.telegramBotToken) {
      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: { status: BroadcastStatus.DONE },
      });
      return;
    }

    const recipients = await this.prisma.customer.findMany({
      where: this.recipientWhere(broadcast.tenantId, broadcast.audience, broadcast.targetCustomerIds),
      select: { telegramChatId: true },
    });

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: BroadcastStatus.SENDING, recipientCount: recipients.length },
    });

    const imageBuffer = image ? Buffer.from(image, 'base64') : null;
    let fileId: string | null = null;
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const chatId = recipient.telegramChatId as string;
      try {
        fileId = await this.sendToRecipient(tenant.telegramBotToken, chatId, broadcast.body, imageBuffer, fileId);
        sentCount += 1;
      } catch (error) {
        failedCount += 1;
        this.logger.error(
          `Broadcast ${broadcastId} failed for a recipient: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
      await this.sleep(SEND_DELAY_MS);
    }

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: BroadcastStatus.DONE, sentCount, failedCount },
    });
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
