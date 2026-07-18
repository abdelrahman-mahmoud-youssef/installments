import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'reminders' }), TelegramModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
})
export class RemindersModule {}
