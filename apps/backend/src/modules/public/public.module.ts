import { Module } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module';
import { ShareLinksModule } from '../share-links/share-links.module';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PublicController } from './public.controller';
import { PublicShareLinkController } from './public-share-link.controller';
import { PublicShopController } from './public-shop.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TelegramModule, StorageModule, OffersModule, ShareLinksModule],
  controllers: [PublicController, PublicShopController, PublicShareLinkController],
  providers: [PublicService],
})
export class PublicModule {}
