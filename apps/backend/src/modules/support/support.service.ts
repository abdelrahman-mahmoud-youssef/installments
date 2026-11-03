import { Injectable } from '@nestjs/common';
import { SupportMessage } from '@prisma/client';
import { randomUUID } from 'crypto';
import { MAX_SUPPORT_IMAGE_UPLOAD_BYTES } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateSupportMessageDto): Promise<SupportMessage> {
    const imageUrl = dto.image ? await this.saveImage(user.tenantId, dto.image) : null;
    return this.prisma.supportMessage.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        subject: dto.subject,
        message: dto.message,
        imageUrl,
      },
    });
  }

  async findMine(user: AuthenticatedUser): Promise<SupportMessage[]> {
    return this.prisma.supportMessage.findMany({
      where: { tenantId: user.tenantId, userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markSeen(user: AuthenticatedUser): Promise<void> {
    await this.prisma.supportMessage.updateMany({
      where: { tenantId: user.tenantId, userId: user.userId, adminReply: { not: null }, seenAt: null },
      data: { seenAt: new Date() },
    });
  }

  private saveImage(tenantId: string, image: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(image, MAX_SUPPORT_IMAGE_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`support-images/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }
}
