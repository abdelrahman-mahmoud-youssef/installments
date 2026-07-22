import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstallmentStatus, NotificationLanguage, ReminderChannel } from '@prisma/client';
import { Queue } from 'bullmq';
import { getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CustomerReminderItem, formatCustomerReminderMessage } from './customer-reminder-message';
import { buildReminderTemplateParams, formatReminderMessage } from './reminder-message';

const REMINDERS_QUEUE = 'reminders';
const DAILY_REMINDER_JOB_NAME = 'send-daily-reminders';
const OUTSTANDING_STATUSES = [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID];

const WHATSAPP_REMINDER_TEMPLATE_NAME = 'payment_reminder';
const WHATSAPP_REMINDER_TEMPLATE_LANGUAGE = 'ar';

interface ReminderTotals {
  dueTodayCount: number;
  dueTodayTotal: number;
  overdueCount: number;
  overdueTotal: number;
}

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDERS_QUEUE) private readonly remindersQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly telegram: TelegramService,
    private readonly whatsapp: WhatsappService,
  ) {}

  onModuleInit(): void {
    void this.registerDailyReminderJob();
  }

  private async registerDailyReminderJob(): Promise<void> {
    const hour = this.config.getOrThrow<number>('REMINDER_HOUR');
    try {
      await this.remindersQueue.add(
        DAILY_REMINDER_JOB_NAME,
        {},
        { repeat: { pattern: `0 ${hour} * * *` }, jobId: DAILY_REMINDER_JOB_NAME },
      );
    } catch (error) {
      this.logger.error(
        `Could not register the daily reminder job: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private getWhatsappCredentials(): { phoneNumberId: string; accessToken: string } | null {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    return phoneNumberId && accessToken ? { phoneNumberId, accessToken } : null;
  }

  async sendRemindersForAllTenants(): Promise<void> {
    const whatsappCredentials = this.getWhatsappCredentials();

    const tenants = await this.prisma.tenant.findMany({
      where: {
        OR: [
          { telegramBotToken: { not: null }, telegramChatId: { not: null } },
          ...(whatsappCredentials ? [{ phone: { not: null } }] : []),
        ],
      },
    });

    for (const tenant of tenants) {
      const totals = await this.computeReminderTotals(tenant.id);

      if (tenant.telegramBotToken && tenant.telegramChatId) {
        try {
          await this.sendTelegramReminder(
            tenant.id,
            tenant.name,
            tenant.telegramBotToken,
            tenant.telegramChatId,
            tenant.notificationLanguage,
            totals,
          );
        } catch (error) {
          this.logger.error(
            `Telegram reminder failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      if (whatsappCredentials && tenant.phone) {
        try {
          await this.sendWhatsappReminder(
            tenant.id,
            tenant.name,
            tenant.phone,
            whatsappCredentials,
            tenant.notificationLanguage,
            totals,
          );
        } catch (error) {
          this.logger.error(
            `WhatsApp reminder failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }
  }

  async sendTestReminder(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (!tenant.telegramBotToken) {
      throw new BadRequestException('This tenant has no Telegram bot configured.');
    }
    if (!tenant.telegramChatId) {
      throw new BadRequestException('This tenant has no Telegram chat configured.');
    }
    const totals = await this.computeReminderTotals(tenant.id);
    await this.sendTelegramReminder(
      tenant.id,
      tenant.name,
      tenant.telegramBotToken,
      tenant.telegramChatId,
      tenant.notificationLanguage,
      totals,
    );
  }

  async sendCustomerReminders(): Promise<void> {
    const today = getUtcToday();
    const tenants = await this.prisma.tenant.findMany({
      where: { telegramBotToken: { not: null }, telegramBotUsername: { not: null } },
      select: { id: true, name: true, telegramBotToken: true },
    });

    for (const tenant of tenants) {
      try {
        await this.sendCustomerRemindersForTenant(tenant.id, tenant.name, tenant.telegramBotToken as string, today);
      } catch (error) {
        this.logger.error(
          `Customer reminders failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  private async sendCustomerRemindersForTenant(
    tenantId: string,
    businessName: string,
    telegramBotToken: string,
    today: Date,
  ): Promise<void> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, telegramChatId: { not: null }, telegramNotificationsEnabled: true },
      select: {
        telegramChatId: true,
        notificationLanguage: true,
        contracts: {
          select: {
            productName: true,
            installments: {
              where: { status: { in: OUTSTANDING_STATUSES }, dueDate: { lte: today } },
              select: { dueDate: true, amount: true, paidAmount: true },
            },
          },
        },
      },
    });

    for (const customer of customers) {
      const dueToday: CustomerReminderItem[] = [];
      const overdue: CustomerReminderItem[] = [];
      for (const contract of customer.contracts) {
        for (const installment of contract.installments) {
          const item: CustomerReminderItem = {
            productName: contract.productName,
            remainingAmount: installment.amount - installment.paidAmount,
            dueDate: installment.dueDate,
          };
          (installment.dueDate.getTime() === today.getTime() ? dueToday : overdue).push(item);
        }
      }

      const message = formatCustomerReminderMessage(
        { businessName, dueToday, overdue },
        customer.notificationLanguage,
      );
      if (!message) {
        continue;
      }

      try {
        await this.telegram.sendMessage(telegramBotToken, customer.telegramChatId as string, message);
      } catch (error) {
        this.logger.error(
          `Customer reminder failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  private async computeReminderTotals(tenantId: string): Promise<ReminderTotals> {
    const today = getUtcToday();

    const [dueToday, overdue] = await Promise.all([
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: OUTSTANDING_STATUSES }, dueDate: today },
        _count: true,
        _sum: { amount: true, paidAmount: true },
      }),
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: OUTSTANDING_STATUSES }, dueDate: { lt: today } },
        _count: true,
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    return {
      dueTodayCount: dueToday._count,
      dueTodayTotal: (dueToday._sum.amount ?? 0) - (dueToday._sum.paidAmount ?? 0),
      overdueCount: overdue._count,
      overdueTotal: (overdue._sum.amount ?? 0) - (overdue._sum.paidAmount ?? 0),
    };
  }

  private async sendTelegramReminder(
    tenantId: string,
    businessName: string,
    telegramBotToken: string,
    telegramChatId: string,
    language: NotificationLanguage,
    totals: ReminderTotals,
  ): Promise<void> {
    const message = formatReminderMessage({ businessName, ...totals }, language);

    try {
      await this.telegram.sendMessage(telegramBotToken, telegramChatId, message);
      await this.prisma.reminderLog.create({
        data: { tenantId, channel: ReminderChannel.TELEGRAM, success: true },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.reminderLog.create({
        data: { tenantId, channel: ReminderChannel.TELEGRAM, success: false, error: errorMessage },
      });
      throw error;
    }
  }

  private async sendWhatsappReminder(
    tenantId: string,
    businessName: string,
    recipientPhone: string,
    credentials: { phoneNumberId: string; accessToken: string },
    language: NotificationLanguage,
    totals: ReminderTotals,
  ): Promise<void> {
    const params = buildReminderTemplateParams({ businessName, ...totals }, language);

    try {
      await this.whatsapp.sendTemplateMessage(
        credentials.phoneNumberId,
        credentials.accessToken,
        recipientPhone,
        WHATSAPP_REMINDER_TEMPLATE_NAME,
        WHATSAPP_REMINDER_TEMPLATE_LANGUAGE,
        params,
      );
      await this.prisma.reminderLog.create({
        data: { tenantId, channel: ReminderChannel.WHATSAPP, success: true },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.reminderLog.create({
        data: { tenantId, channel: ReminderChannel.WHATSAPP, success: false, error: errorMessage },
      });
      throw error;
    }
  }
}
