import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationLanguage, Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
  notificationLanguage: NotificationLanguage;
}

function toSettings(tenant: Tenant): NotificationSettings {
  return {
    telegramConfigured: Boolean(tenant.telegramBotToken),
    telegramChatId: tenant.telegramChatId,
    notificationLanguage: tenant.notificationLanguage,
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async getNotifications(tenantId: string): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return toSettings(tenant);
  }

  async updateNotifications(
    tenantId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramBotToken: dto.telegramBotToken, telegramChatId: null, telegramBotUsername: null },
    });
    return toSettings(tenant);
  }

  async setLanguage(tenantId: string, language: NotificationLanguage): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { notificationLanguage: language },
    });
    return toSettings(tenant);
  }

  async disconnect(tenantId: string): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramBotToken: null, telegramChatId: null, telegramBotUsername: null },
    });
    return toSettings(tenant);
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

    const botUsername = await this.telegram.getBotUsername(tenant.telegramBotToken);
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramChatId: chatId, telegramBotUsername: botUsername },
    });
    const message =
      tenant.notificationLanguage === NotificationLanguage.AR
        ? `✅ ${tenant.name} — اترابطت إشعارات تيليجرام بنجاح.`
        : `✅ ${tenant.name} — Telegram notifications are connected.`;
    await this.telegram.sendMessage(tenant.telegramBotToken, chatId, message);
  }
}
