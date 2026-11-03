import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlatformAdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('PLATFORM_ADMIN_EMAIL');
    const password = this.config.get<string>('PLATFORM_ADMIN_PASSWORD');
    if (!email || !password) {
      return;
    }

    const existing = await this.prisma.platformAdmin.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return;
    }

    await this.prisma.platformAdmin.create({
      data: {
        email,
        name: this.config.getOrThrow<string>('PLATFORM_ADMIN_NAME'),
        passwordHash: await hashPassword(password),
      },
    });
    this.logger.log(`Created platform admin ${email}`);
  }
}
