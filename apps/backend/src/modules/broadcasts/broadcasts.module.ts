import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsProcessor } from './broadcasts.processor';
import { BroadcastsService } from './broadcasts.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'broadcasts' }), TelegramModule],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsProcessor],
})
export class BroadcastsModule {}
