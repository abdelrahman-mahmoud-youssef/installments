import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { PublicController } from './public.controller';
import { PublicShopController } from './public-shop.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TelegramModule],
  controllers: [PublicController, PublicShopController],
  providers: [PublicService],
})
export class PublicModule {}
