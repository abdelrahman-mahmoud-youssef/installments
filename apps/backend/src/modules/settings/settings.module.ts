import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TelegramModule, StorageModule],
  controllers: [SettingsController, BrandingController],
  providers: [SettingsService, BrandingService],
})
export class SettingsModule {}
