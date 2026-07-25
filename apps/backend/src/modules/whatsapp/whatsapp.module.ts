import { Module } from '@nestjs/common';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappWebhookController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
