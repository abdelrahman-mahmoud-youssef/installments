import { Module } from '@nestjs/common';
import { ExpoPushClient } from './expo-push.client';
import { PushAnnouncementsService } from './push-announcements.service';
import { PushDevicesController } from './push-devices.controller';
import { PushService } from './push.service';
import { SubscriptionPushService } from './subscription-push.service';

@Module({
  controllers: [PushDevicesController],
  providers: [ExpoPushClient, PushService, SubscriptionPushService, PushAnnouncementsService],
  exports: [SubscriptionPushService, PushAnnouncementsService],
})
export class PushModule {}
