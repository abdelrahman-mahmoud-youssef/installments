import { Injectable, Logger } from '@nestjs/common';
import { NotificationLanguage, Prisma } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { PushRoute } from './push.types';
import { PushService } from './push.service';
import { buildSubscriptionPushContent } from './subscription-push-message';
import {
  buildSubscriptionPushDedupeKey,
  resolveExpiryDateForMilestone,
  SUBSCRIPTION_PUSH_MILESTONES,
  SubscriptionPushKind,
} from './subscription-push-schedule';

const UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';

@Injectable()
export class SubscriptionPushService {
  private readonly logger = new Logger(SubscriptionPushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async sendNotices(): Promise<void> {
    const today = getUtcToday();
    for (const milestone of SUBSCRIPTION_PUSH_MILESTONES) {
      const expiresOn = resolveExpiryDateForMilestone(milestone, today);
      const tenants = await this.prisma.tenant.findMany({
        where: { subscriptionExpiresOn: expiresOn },
        select: { id: true },
      });
      for (const tenant of tenants) {
        await this.sendNoticeOnce(milestone.kind, tenant.id, expiresOn);
      }
    }
  }

  private async sendNoticeOnce(kind: SubscriptionPushKind, tenantId: string, expiresOn: Date): Promise<void> {
    const loggedContent = buildSubscriptionPushContent(kind, NotificationLanguage.EN);
    const logId = await this.claimNotice(kind, tenantId, expiresOn, loggedContent);
    if (!logId) {
      return;
    }
    try {
      const recipientCount = await this.pushService.sendToTenants(
        [tenantId],
        (language) => buildSubscriptionPushContent(kind, language),
        PushRoute.SUPPORT,
      );
      await this.prisma.pushNotificationLog.update({ where: { id: logId }, data: { recipientCount } });
    } catch (error) {
      this.logger.error(
        `Could not send the ${kind} push for tenant ${tenantId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private async claimNotice(
    kind: SubscriptionPushKind,
    tenantId: string,
    expiresOn: Date,
    content: { title: string; body: string },
  ): Promise<string | null> {
    try {
      const log = await this.prisma.pushNotificationLog.create({
        data: { kind, tenantId, dedupeKey: buildSubscriptionPushDedupeKey(kind, tenantId, expiresOn), ...content },
        select: { id: true },
      });
      return log.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_ERROR_CODE) {
        return null;
      }
      throw error;
    }
  }
}
