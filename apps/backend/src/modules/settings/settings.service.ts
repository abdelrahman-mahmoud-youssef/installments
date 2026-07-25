import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationLanguage, ReminderMessageSettings, Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { SetTelegramPublicVisibilityDto } from './dto/set-telegram-public-visibility.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { UpdateReminderMessageSettingsDto } from './dto/update-reminder-message-settings.dto';

export interface ReminderMessageToggles {
  showProgress: boolean;
  showRemaining: boolean;
  showLocation: boolean;
  showPayLink: boolean;
}

export interface NotificationSettings {
  telegramConfigured: boolean;
  telegramChatId: string | null;
  showTelegramOnPublicPage: boolean;
  notificationLanguage: NotificationLanguage;
  reminderMessage: ReminderMessageToggles;
}

export const DEFAULT_REMINDER_MESSAGE_TOGGLES: ReminderMessageToggles = {
  showProgress: true,
  showRemaining: true,
  showLocation: true,
  showPayLink: true,
};

function toReminderMessageToggles(settings: ReminderMessageSettings | null): ReminderMessageToggles {
  if (!settings) {
    return DEFAULT_REMINDER_MESSAGE_TOGGLES;
  }
  return {
    showProgress: settings.showProgress,
    showRemaining: settings.showRemaining,
    showLocation: settings.showLocation,
    showPayLink: settings.showPayLink,
  };
}

const WITH_REMINDER_MESSAGE_SETTINGS = { include: { reminderMessageSettings: true } } as const;

function toSettings(tenant: Tenant & { reminderMessageSettings: ReminderMessageSettings | null }): NotificationSettings {
  return {
    telegramConfigured: Boolean(tenant.telegramBotToken),
    telegramChatId: tenant.telegramChatId,
    showTelegramOnPublicPage: tenant.showTelegramOnPublicPage,
    notificationLanguage: tenant.notificationLanguage,
    reminderMessage: toReminderMessageToggles(tenant.reminderMessageSettings),
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async getNotifications(tenantId: string): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
    });
    return toSettings(tenant);
  }

  async updateNotifications(
    tenantId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramBotToken: dto.telegramBotToken, telegramChatId: null, telegramBotUsername: null },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
    });
    return toSettings(tenant);
  }

  async setLanguage(tenantId: string, language: NotificationLanguage): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { notificationLanguage: language },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
    });
    return toSettings(tenant);
  }

  async setTelegramPublicVisibility(
    tenantId: string,
    dto: SetTelegramPublicVisibilityDto,
  ): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { showTelegramOnPublicPage: dto.showTelegramOnPublicPage },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
    });
    return toSettings(tenant);
  }

  async updateReminderMessageSettings(
    tenantId: string,
    dto: UpdateReminderMessageSettingsDto,
  ): Promise<NotificationSettings> {
    await this.prisma.reminderMessageSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...DEFAULT_REMINDER_MESSAGE_TOGGLES, ...dto },
      update: { ...dto },
    });
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
    });
    return toSettings(tenant);
  }

  async disconnect(tenantId: string): Promise<NotificationSettings> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramBotToken: null, telegramChatId: null, telegramBotUsername: null },
      ...WITH_REMINDER_MESSAGE_SETTINGS,
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
