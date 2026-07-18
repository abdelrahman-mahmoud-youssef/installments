import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async getNotifications(tenantId: string): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return {
      telegramConfigured: Boolean(tenant.telegramBotToken),
      telegramChatId: tenant.telegramChatId,
    };
  }

  async updateNotifications(
    tenantId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramBotToken: dto.telegramBotToken, telegramChatId: null },
    });
    return {
      telegramConfigured: Boolean(tenant.telegramBotToken),
      telegramChatId: tenant.telegramChatId,
    };
  }

  async sendTest(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (!tenant.telegramBotToken) {
      throw new BadRequestException('Add your Telegram bot token before sending a test message.');
    }

    const chatId = await this.telegram.getMostRecentChatId(tenant.telegramBotToken);
    if (!chatId) {
      throw new BadRequestException('Open your bot in Telegram and press Start, then try again.');
    }

    await this.prisma.tenant.update({ where: { id: tenantId }, data: { telegramChatId: chatId } });
    await this.telegram.sendMessage(
      tenant.telegramBotToken,
      chatId,
      `✅ ${tenant.name} — Telegram notifications are connected.`,
    );
  }
}
