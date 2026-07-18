import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstallmentStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { formatReminderMessage } from './reminder-message';

const REMINDERS_QUEUE = 'reminders';
const DAILY_REMINDER_JOB_NAME = 'send-daily-reminders';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue(REMINDERS_QUEUE) private readonly remindersQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const hour = this.config.get<string>('REMINDER_HOUR', '8');
    await this.remindersQueue.add(
      DAILY_REMINDER_JOB_NAME,
      {},
      { repeat: { pattern: `0 ${hour} * * *` }, jobId: DAILY_REMINDER_JOB_NAME },
    );
  }

  async sendRemindersForAllTenants(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { telegramChatId: { not: null } },
    });

    for (const tenant of tenants) {
      try {
        await this.sendReminderForTenant(tenant.id, tenant.name, tenant.telegramChatId as string);
      } catch (error) {
        this.logger.error(
          `Reminder failed for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  async sendTestReminder(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (!tenant.telegramChatId) {
      throw new BadRequestException('This tenant has no Telegram chat configured.');
    }
    await this.sendReminderForTenant(tenant.id, tenant.name, tenant.telegramChatId);
  }

  private async sendReminderForTenant(
    tenantId: string,
    businessName: string,
    telegramChatId: string,
  ): Promise<void> {
    const today = getUtcToday();
    const outstandingStatuses = [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID];

    const [dueToday, overdue] = await Promise.all([
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: outstandingStatuses }, dueDate: today },
        _count: true,
        _sum: { amount: true, paidAmount: true },
      }),
      this.prisma.installment.aggregate({
        where: { tenantId, status: { in: outstandingStatuses }, dueDate: { lt: today } },
        _count: true,
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    const message = formatReminderMessage({
      businessName,
      dueTodayCount: dueToday._count,
      dueTodayTotal: (dueToday._sum.amount ?? 0) - (dueToday._sum.paidAmount ?? 0),
      overdueCount: overdue._count,
      overdueTotal: (overdue._sum.amount ?? 0) - (overdue._sum.paidAmount ?? 0),
    });

    try {
      await this.sendTelegramMessage(telegramChatId, message);
      await this.prisma.reminderLog.create({ data: { tenantId, success: true } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.reminderLog.create({ data: { tenantId, success: false, error: errorMessage } });
      throw error;
    }
  }

  private async sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API error ${response.status}: ${body}`);
    }
  }
}
