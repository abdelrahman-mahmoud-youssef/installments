import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { ShareLinksModule } from '../share-links/share-links.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'reminders' }), TelegramModule, WhatsappModule, ShareLinksModule, PushModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
})
export class RemindersModule {}
