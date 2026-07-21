import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PublicController } from './public.controller';
import { PublicShopController } from './public-shop.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TelegramModule, StorageModule],
  controllers: [PublicController, PublicShopController],
  providers: [PublicService],
})
export class PublicModule {}
