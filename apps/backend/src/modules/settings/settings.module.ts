import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { CounterpartiesController } from './counterparties.controller';
import { CounterpartiesService } from './counterparties.service';
import { PaymentMethodLimitService } from './payment-method-limit.service';
import { PaymentMethodTransactionsController } from './payment-method-transactions.controller';
import { PaymentMethodTransactionsService } from './payment-method-transactions.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TelegramModule, StorageModule, WhatsappModule],
  controllers: [
    SettingsController,
    BrandingController,
    PaymentMethodsController,
    PaymentMethodTransactionsController,
    CounterpartiesController,
  ],
  providers: [
    SettingsService,
    BrandingService,
    PaymentMethodsService,
    PaymentMethodTransactionsService,
    PaymentMethodLimitService,
    CounterpartiesService,
  ],
  exports: [PaymentMethodLimitService],
})
export class SettingsModule {}
