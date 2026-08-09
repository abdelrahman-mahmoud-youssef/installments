import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BroadcastRecipientStatus, Customer, Prisma, ReminderChannel } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { MAX_CUSTOMER_ID_UPLOAD_BYTES, MAX_CUSTOMER_PHOTO_UPLOAD_BYTES } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { overdueInstallmentWhere } from '../../common/installments/overdue-where';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerNotificationQueryDto } from './dto/customer-notification-query.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

export type CustomerListItem = Customer & { hasOverdue: boolean };

export type CustomerNotificationType = 'REMINDER' | 'BROADCAST';

export interface CustomerNotificationHistoryItem {
  id: string;
  type: CustomerNotificationType;
  channel: ReminderChannel;
  success: boolean;
  error: string | null;
  sentAt: Date;
  preview: string | null;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(tenantId: string, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const { photo, idImageFront, idImageBack, ...rest } = createCustomerDto;
    const [photoUrl, idImageFrontUrl, idImageBackUrl] = await Promise.all([
      photo ? this.savePhoto(tenantId, photo) : undefined,
      idImageFront ? this.saveIdImage(tenantId, idImageFront) : undefined,
      idImageBack ? this.saveIdImage(tenantId, idImageBack) : undefined,
    ]);
    return this.prisma.customer.create({ data: { ...rest, tenantId, photoUrl, idImageFrontUrl, idImageBackUrl } });
  }

  async findAll(tenantId: string, query: CustomerQueryDto): Promise<PaginatedResult<CustomerListItem>> {
    const today = getUtcToday();
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q } },
        ],
      }),
      ...(query.delayedOnly && {
        contracts: { some: { installments: { some: overdueInstallmentWhere(today) } } },
      }),
    };

    const [rawData, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          contracts: { where: { installments: { some: overdueInstallmentWhere(today) } }, select: { id: true }, take: 1 },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data = rawData.map(({ contracts, ...rest }) => ({ ...rest, hasOverdue: contracts.length > 0 }));

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<Prisma.CustomerGetPayload<{ include: { contracts: true } }>> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: { contracts: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
    return customer;
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.ensureExists(tenantId, id);
    const { photo, idImageFront, idImageBack, ...rest } = updateCustomerDto;
    const [photoUrl, idImageFrontUrl, idImageBackUrl] = await Promise.all([
      photo ? this.savePhoto(tenantId, photo) : undefined,
      idImageFront ? this.saveIdImage(tenantId, idImageFront) : undefined,
      idImageBack ? this.saveIdImage(tenantId, idImageBack) : undefined,
    ]);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(photoUrl && { photoUrl }),
        ...(idImageFrontUrl && { idImageFrontUrl }),
        ...(idImageBackUrl && { idImageBackUrl }),
      },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.ensureExists(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
  }

  async getNotificationHistory(
    tenantId: string,
    customerId: string,
    query: CustomerNotificationQueryDto,
  ): Promise<PaginatedResult<CustomerNotificationHistoryItem>> {
    await this.ensureExists(tenantId, customerId);

    const fetchLimit = query.page * query.limit;

    const [reminderLogs, reminderTotal, broadcastRecipients, broadcastTotal] = await Promise.all([
      this.prisma.customerNotificationLog.findMany({
        where: { tenantId, customerId },
        orderBy: { sentAt: 'desc' },
        take: fetchLimit,
      }),
      this.prisma.customerNotificationLog.count({ where: { tenantId, customerId } }),
      this.prisma.broadcastRecipient.findMany({
        where: { tenantId, customerId, status: { not: BroadcastRecipientStatus.PENDING } },
        orderBy: { sentAt: 'desc' },
        take: fetchLimit,
        select: {
          id: true,
          status: true,
          sentAt: true,
          error: true,
          broadcast: { select: { body: true, createdAt: true } },
        },
      }),
      this.prisma.broadcastRecipient.count({
        where: { tenantId, customerId, status: { not: BroadcastRecipientStatus.PENDING } },
      }),
    ]);

    const items: CustomerNotificationHistoryItem[] = [
      ...reminderLogs.map(
        (log): CustomerNotificationHistoryItem => ({
          id: log.id,
          type: 'REMINDER',
          channel: log.channel,
          success: log.success,
          error: log.error,
          sentAt: log.sentAt,
          preview: null,
        }),
      ),
      ...broadcastRecipients.map(
        (recipient): CustomerNotificationHistoryItem => ({
          id: recipient.id,
          type: 'BROADCAST',
          channel: ReminderChannel.TELEGRAM,
          success: recipient.status === BroadcastRecipientStatus.SENT,
          error: recipient.error,
          sentAt: recipient.sentAt ?? recipient.broadcast.createdAt,
          preview: recipient.broadcast.body,
        }),
      ),
    ].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

    const start = (query.page - 1) * query.limit;
    const data = items.slice(start, start + query.limit);

    return buildPaginatedResult(data, reminderTotal + broadcastTotal, query.page, query.limit);
  }

  private async ensureExists(tenantId: string, id: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
  }

  private async saveIdImage(tenantId: string, idImage: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(idImage, MAX_CUSTOMER_ID_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`customer-ids/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }

  private async savePhoto(tenantId: string, photo: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(photo, MAX_CUSTOMER_PHOTO_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`customer-photos/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }
}
