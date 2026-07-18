import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TelegramModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
