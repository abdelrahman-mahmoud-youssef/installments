import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'reminders' }), TelegramModule, WhatsappModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
})
export class RemindersModule {}
