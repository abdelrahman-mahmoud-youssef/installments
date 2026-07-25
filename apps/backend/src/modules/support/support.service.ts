import { Injectable } from '@nestjs/common';
import { SupportMessage } from '@prisma/client';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateSupportMessageDto): Promise<SupportMessage> {
    return this.prisma.supportMessage.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        subject: dto.subject,
        message: dto.message,
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
}
