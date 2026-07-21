import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TelegramModule, StorageModule],
  controllers: [SettingsController, BrandingController, PaymentMethodsController],
  providers: [SettingsService, BrandingService, PaymentMethodsService],
})
export class SettingsModule {}
