import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationLanguage, ReminderChannel } from '@prisma/client';
import { getUtcToday, startOfUtcMonth } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { toWhatsappRecipient } from '../whatsapp/whatsapp-phone';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { buildPaymentMethodLimitAlertParams } from './payment-method-limit-message';
import { getPaymentMethodMonthlyUsage } from './payment-method-usage.util';

const LIMIT_ALERT_THRESHOLD_RATIO = 0.8;

interface WhatsappTemplate {
  name: string;
  languageCode: string;
}

const PAYMENT_METHOD_LIMIT_ALERT_TEMPLATE: Record<NotificationLanguage, WhatsappTemplate> = {
  [NotificationLanguage.AR]: { name: 'admin_wallet_limit_alert_ar', languageCode: 'ar' },
  [NotificationLanguage.EN]: { name: 'admin_wallet_limit_alert_en', languageCode: 'en' },
};

@Injectable()
export class PaymentMethodLimitService {
  private readonly logger = new Logger(PaymentMethodLimitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async checkAndAlert(tenantId: string, paymentMethodId: string): Promise<void> {
    try {
      await this.checkAndAlertUnsafe(tenantId, paymentMethodId);
    } catch (error) {
      this.logger.error(
        `Payment method limit check failed for ${paymentMethodId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async checkAndAlertUnsafe(tenantId: string, paymentMethodId: string): Promise<void> {
    const method = await this.prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, tenantId } });
    if (!method || method.monthlyLimit == null) {
      return;
    }

    const monthKey = this.getMonthKey(getUtcToday());
    if (method.lastLimitAlertMonth === monthKey) {
      return;
    }

    const monthStart = startOfUtcMonth(getUtcToday());
    const usage = await getPaymentMethodMonthlyUsage(this.prisma, tenantId, paymentMethodId, monthStart);
    const used = usage.total;
    if (used / method.monthlyLimit < LIMIT_ALERT_THRESHOLD_RATIO) {
      return;
    }

    const credentials = this.getWhatsappCredentials();
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, phone: true, notificationLanguage: true },
    });
    if (!credentials || !tenant?.phone) {
      return;
    }

    const template = PAYMENT_METHOD_LIMIT_ALERT_TEMPLATE[tenant.notificationLanguage];
    const params = buildPaymentMethodLimitAlertParams(
      {
        businessName: tenant.name,
        methodLabel: method.label,
        accountDetails: method.details,
        used,
        limit: method.monthlyLimit,
        remaining: Math.max(method.monthlyLimit - used, 0),
      },
      tenant.notificationLanguage,
    );

    try {
      await this.whatsapp.sendTemplateMessage(
        credentials.phoneNumberId,
        credentials.accessToken,
        toWhatsappRecipient(tenant.phone),
        template.name,
        template.languageCode,
        params,
      );
      await this.prisma.paymentMethod.update({ where: { id: paymentMethodId }, data: { lastLimitAlertMonth: monthKey } });
      await this.prisma.reminderLog.create({ data: { tenantId, channel: ReminderChannel.WHATSAPP, success: true } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.prisma.reminderLog.create({
        data: { tenantId, channel: ReminderChannel.WHATSAPP, success: false, error: errorMessage },
      });
      throw error;
    }
  }

  private getMonthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
  }

  private getWhatsappCredentials(): { phoneNumberId: string; accessToken: string } | null {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    return phoneNumberId && accessToken ? { phoneNumberId, accessToken } : null;
  }
}
