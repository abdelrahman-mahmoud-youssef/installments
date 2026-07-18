import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TelegramModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
