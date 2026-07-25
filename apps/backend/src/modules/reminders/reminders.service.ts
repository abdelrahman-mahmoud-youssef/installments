import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstallmentStatus, NotificationLanguage, ReminderChannel } from '@prisma/client';
import { Queue } from 'bullmq';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { ShareLinksService } from '../share-links/share-links.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CustomerReminderItem, formatCustomerReminderMessage } from './customer-reminder-message';
import { buildCustomerWhatsappReminderParams } from './customer-whatsapp-reminder-message';
import { buildEveningSummaryTemplateParams } from './evening-summary-message';
import { buildReminderTemplateParams, formatReminderMessage } from './reminder-message';

export const REMINDERS_QUEUE = 'reminders';
export const DAILY_REMINDER_JOB_NAME = 'send-daily-reminders';
export const EVENING_SUMMARY_JOB_NAME = 'send-evening-summary';
const OUTSTANDING_STATUSES = [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID];

interface WhatsappTemplate {
  name: string;
  languageCode: string;
}

const WHATSAPP_MORNING_SUMMARY_TEMPLATE: Record<NotificationLanguage, WhatsappTemplate> = {
  [NotificationLanguage.AR]: { name: 'admin_morning_summary_ar', languageCode: 'ar' },
  [NotificationLanguage.EN]: { name: 'admin_morning_summary_en', languageCode: 'en' },
};

const WHATSAPP_EVENING_SUMMARY_TEMPLATE: Record<NotificationLanguage, WhatsappTemplate> = {
  [NotificationLanguage.AR]: { name: 'admin_evening_summary_ar', languageCode: 'ar' },
  [NotificationLanguage.EN]: { name: 'admin_evening_summary_en', languageCode: 'en' },
};

const CUSTOMER_REMINDER_WITH_PAY_BUTTON_TEMPLATE: Record<NotificationLanguage, WhatsappTemplate> = {
  [NotificationLanguage.AR]: { name: 'customer_reminder_pay_ar', languageCode: 'ar' },
  [NotificationLanguage.EN]: { name: 'customer_reminder_pay_en', languageCode: 'en' },
};

const CUSTOMER_REMINDER_NO_PAY_BUTTON_TEMPLATE: Record<NotificationLanguage, WhatsappTemplate> = {
  [NotificationLanguage.AR]: { name: 'customer_reminder_no_pay_ar', languageCode: 'ar' },
  [NotificationLanguage.EN]: { name: 'customer_reminder_no_pay_en', languageCode: 'en' },
};

interface ReminderTotals {
  dueTodayCount: number;
  dueTodayTotal: number;
  overdueCount: number;
  overdueTotal: number;
}

interface EveningTotals {
  collectedToday: number;
  overdueTotal: number;
  dueTomorrowTotal: number;
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
    private readonly shareLinks: ShareLinksService,
  ) {}

  onModuleInit(): void {
    void this.registerDailyReminderJob();
    void this.registerEveningSummaryJob();
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

  private async registerEveningSummaryJob(): Promise<void> {
    const hour = this.config.getOrThrow<number>('EVENING_SUMMARY_HOUR');
    try {
      await this.remindersQueue.add(
        EVENING_SUMMARY_JOB_NAME,
        {},
        { repeat: { pattern: `0 ${hour} * * *` }, jobId: EVENING_SUMMARY_JOB_NAME },
      );
    } catch (error) {
      this.logger.error(
        `Could not register the evening summary job: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private getWhatsappCredentials(): { phoneNumberId: string; accessToken: string } | null {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    return phoneNumberId && accessToken ? { phoneNumberId, accessToken } : null;
  }

  private toWhatsappRecipient(phone: string): string {
    return `20${phone.replace(/\D/g, '').replace(/^0/, '')}`;
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

  async sendEveningSummaryForAllTenants(): Promise<void> {
    const whatsappCredentials = this.getWhatsappCredentials();
    if (!whatsappCredentials) {
      return;
    }

    const tenants = await this.prisma.tenant.findMany({ where: { phone: { not: null } } });

    for (const tenant of tenants) {
      try {
        const totals = await this.computeEveningTotals(tenant.id);
        await this.sendWhatsappEveningSummary(
          tenant.id,
          tenant.name,
          tenant.phone as string,
          whatsappCredentials,
          tenant.notificationLanguage,
          totals,
        );
      } catch (error) {
        this.logger.error(
          `Evening summary failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
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
    const whatsappCredentials = this.getWhatsappCredentials();

    const tenants = await this.prisma.tenant.findMany({
      where: whatsappCredentials
        ? undefined
        : { telegramBotToken: { not: null }, telegramBotUsername: { not: null } },
      select: { id: true, name: true, slug: true, telegramBotToken: true, telegramBotUsername: true },
    });

    for (const tenant of tenants) {
      try {
        const hasActivePaymentMethod = whatsappCredentials
          ? (await this.prisma.paymentMethod.count({ where: { tenantId: tenant.id, isActive: true } })) > 0
          : false;
        const telegramBotToken =
          tenant.telegramBotToken && tenant.telegramBotUsername ? tenant.telegramBotToken : null;

        await this.sendCustomerRemindersForTenant(
          tenant.id,
          tenant.slug,
          tenant.name,
          telegramBotToken,
          whatsappCredentials,
          hasActivePaymentMethod,
          today,
        );
      } catch (error) {
        this.logger.error(
          `Customer reminders failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  private async sendCustomerRemindersForTenant(
    tenantId: string,
    tenantSlug: string,
    businessName: string,
    telegramBotToken: string | null,
    whatsappCredentials: { phoneNumberId: string; accessToken: string } | null,
    hasActivePaymentMethod: boolean,
    today: Date,
  ): Promise<void> {
    const customers = await this.prisma.customer.findMany({
      where: whatsappCredentials
        ? { tenantId }
        : { tenantId, telegramChatId: { not: null }, telegramNotificationsEnabled: true },
      select: {
        id: true,
        name: true,
        publicId: true,
        phone: true,
        telegramChatId: true,
        telegramNotificationsEnabled: true,
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

      if (telegramBotToken && customer.telegramChatId && customer.telegramNotificationsEnabled) {
        const payUrl = await this.buildPayUrl(tenantId, tenantSlug, customer.publicId, customer.notificationLanguage);
        const message = formatCustomerReminderMessage(
          { businessName, dueToday, overdue, payUrl },
          customer.notificationLanguage,
        );
        if (message) {
          try {
            await this.telegram.sendMessage(telegramBotToken, customer.telegramChatId, message);
            await this.prisma.customerNotificationLog.create({
              data: { tenantId, customerId: customer.id, channel: ReminderChannel.TELEGRAM, success: true },
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Customer reminder failed: ${errorMessage}`);
            await this.prisma.customerNotificationLog.create({
              data: {
                tenantId,
                customerId: customer.id,
                channel: ReminderChannel.TELEGRAM,
                success: false,
                error: errorMessage,
              },
            });
          }
        }
      }

      if (whatsappCredentials) {
        const totalOutstanding = [...dueToday, ...overdue].reduce((sum, item) => sum + item.remainingAmount, 0);
        if (totalOutstanding > 0) {
          await this.sendCustomerWhatsappReminder(
            tenantId,
            customer.id,
            customer.publicId,
            customer.phone,
            customer.name,
            businessName,
            customer.notificationLanguage,
            totalOutstanding,
            hasActivePaymentMethod,
            whatsappCredentials,
          );
        }
      }
    }
  }

  private async buildPayUrl(
    tenantId: string,
    tenantSlug: string,
    customerPublicId: string,
    language: NotificationLanguage,
  ): Promise<string | null> {
    const localePrefix = language === NotificationLanguage.AR ? '/ar' : '';
    const targetPath = `${localePrefix}/customer/${customerPublicId}`;

    const rootDomain = this.config.get<string>('ROOT_DOMAIN');
    if (rootDomain) {
      const { code } = await this.shareLinks.getOrCreate(tenantId, targetPath);
      return `https://${tenantSlug}.${rootDomain}/p/${code}`;
    }

    const frontendUrl = this.config
      .get<string>('FRONTEND_URL')
      ?.split(',')
      .map((url) => url.trim())
      .filter(Boolean)[0];
    return frontendUrl ? `${frontendUrl}${targetPath}` : null;
  }

  private async sendCustomerWhatsappReminder(
    tenantId: string,
    customerId: string,
    customerPublicId: string,
    customerPhone: string,
    customerName: string,
    businessName: string,
    language: NotificationLanguage,
    totalOutstanding: number,
    hasActivePaymentMethod: boolean,
    credentials: { phoneNumberId: string; accessToken: string },
  ): Promise<void> {
    const template = hasActivePaymentMethod
      ? CUSTOMER_REMINDER_WITH_PAY_BUTTON_TEMPLATE[language]
      : CUSTOMER_REMINDER_NO_PAY_BUTTON_TEMPLATE[language];
    const params = buildCustomerWhatsappReminderParams({ customerName, businessName, totalOutstanding }, language);
    const recipient = this.toWhatsappRecipient(customerPhone);

    try {
      await this.whatsapp.sendTemplateMessage(
        credentials.phoneNumberId,
        credentials.accessToken,
        recipient,
        template.name,
        template.languageCode,
        params,
        hasActivePaymentMethod ? customerPublicId : undefined,
      );
      await this.prisma.customerNotificationLog.create({
        data: { tenantId, customerId, channel: ReminderChannel.WHATSAPP, success: true },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`WhatsApp customer reminder failed: ${errorMessage}`);
      await this.prisma.customerNotificationLog.create({
        data: { tenantId, customerId, channel: ReminderChannel.WHATSAPP, success: false, error: errorMessage },
      });
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

  private async computeEveningTotals(tenantId: string): Promise<EveningTotals> {
    const today = getUtcToday();
    const tomorrow = addUtcDays(today, 1);
    const dayAfterTomorrow = addUtcDays(today, 2);

    const [collected, overdue, dueTomorrow] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, paidAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: OUTSTANDING_STATUSES }, dueDate: { lt: today } },
        _sum: { amount: true, paidAmount: true },
      }),
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: OUTSTANDING_STATUSES }, dueDate: { gte: tomorrow, lt: dayAfterTomorrow } },
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    return {
      collectedToday: collected._sum.amount ?? 0,
      overdueTotal: (overdue._sum.amount ?? 0) - (overdue._sum.paidAmount ?? 0),
      dueTomorrowTotal: (dueTomorrow._sum.amount ?? 0) - (dueTomorrow._sum.paidAmount ?? 0),
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
    const template = WHATSAPP_MORNING_SUMMARY_TEMPLATE[language];
    const params = buildReminderTemplateParams({ businessName, ...totals }, language);

    try {
      await this.whatsapp.sendTemplateMessage(
        credentials.phoneNumberId,
        credentials.accessToken,
        recipientPhone,
        template.name,
        template.languageCode,
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

  private async sendWhatsappEveningSummary(
    tenantId: string,
    businessName: string,
    recipientPhone: string,
    credentials: { phoneNumberId: string; accessToken: string },
    language: NotificationLanguage,
    totals: EveningTotals,
  ): Promise<void> {
    const template = WHATSAPP_EVENING_SUMMARY_TEMPLATE[language];
    const params = buildEveningSummaryTemplateParams({ businessName, ...totals }, language);

    try {
      await this.whatsapp.sendTemplateMessage(
        credentials.phoneNumberId,
        credentials.accessToken,
        recipientPhone,
        template.name,
        template.languageCode,
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
