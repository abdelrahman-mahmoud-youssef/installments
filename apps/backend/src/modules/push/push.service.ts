import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import { ExpoPushClient, ExpoPushMessage } from './expo-push.client';
import { PushContentResolver, PushRoute } from './push.types';

@Injectable()
export class PushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPushClient: ExpoPushClient,
  ) {}

  async registerDevice(user: AuthenticatedUser, dto: RegisterPushDeviceDto): Promise<void> {
    await this.prisma.pushDevice.upsert({
      where: { token: dto.token },
      create: { token: dto.token, language: dto.language, tenantId: user.tenantId, userId: user.userId },
      update: { language: dto.language, tenantId: user.tenantId, userId: user.userId },
    });
  }

  async unregisterDevice(user: AuthenticatedUser, token: string): Promise<void> {
    await this.prisma.pushDevice.deleteMany({ where: { token, userId: user.userId, tenantId: user.tenantId } });
  }

  async sendToTenants(tenantIds: string[], resolveContent: PushContentResolver, route: PushRoute): Promise<number> {
    if (tenantIds.length === 0) {
      return 0;
    }
    const devices = await this.prisma.pushDevice.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { token: true, language: true },
    });
    const messages: ExpoPushMessage[] = devices.map((device) => ({
      to: device.token,
      ...resolveContent(device.language),
      sound: 'default',
      data: { route },
    }));
    const unregisteredTokens = await this.expoPushClient.send(messages);
    if (unregisteredTokens.length > 0) {
      await this.prisma.pushDevice.deleteMany({ where: { token: { in: unregisteredTokens } } });
    }
    return messages.length - unregisteredTokens.length;
  }
}
