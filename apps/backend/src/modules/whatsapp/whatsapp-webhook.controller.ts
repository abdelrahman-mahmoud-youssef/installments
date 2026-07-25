import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

const AUTO_REPLY_COOLDOWN_MS = 60_000;

const AUTO_REPLY_TEXT =
  'شكراً لتواصلك 🙏 ده رد تلقائي، وهنرد عليك أقرب وقت. لو الموضوع مستعجل، تقدر تتصل بالمحل مباشرة.\n\n' +
  "Thanks for reaching out! This is an automated reply — we'll get back to you soon. For anything urgent, please call the shop directly.";

interface WhatsappWebhookMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
}

interface WhatsappWebhookPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: WhatsappWebhookMessage[];
      };
    }[];
  }[];
}

@Controller('whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);
  private readonly lastAutoReplyAt = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const expectedToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && expectedToken && verifyToken === expectedToken) {
      return challenge;
    }
    throw new ForbiddenException('WhatsApp webhook verification failed.');
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receiveMessage(@Body() payload: WhatsappWebhookPayload): Promise<{ received: true }> {
    const messages = this.extractMessages(payload);
    if (messages.length === 0) {
      return { received: true };
    }

    await this.prisma.whatsappMessage.createMany({
      data: messages.map((message) => ({
        fromPhone: message.from,
        type: message.type,
        body: message.text?.body,
        messageId: message.id,
      })),
      skipDuplicates: true,
    });

    const senders = [...new Set(messages.map((message) => message.from))];
    await Promise.all(senders.map((from) => this.replyIfDue(from)));

    return { received: true };
  }

  private extractMessages(payload: WhatsappWebhookPayload): WhatsappWebhookMessage[] {
    const messages: WhatsappWebhookMessage[] = [];
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        messages.push(...(change.value?.messages ?? []));
      }
    }
    return messages;
  }

  private async replyIfDue(from: string): Promise<void> {
    const now = Date.now();
    const lastReplyAt = this.lastAutoReplyAt.get(from);
    if (lastReplyAt && now - lastReplyAt < AUTO_REPLY_COOLDOWN_MS) {
      return;
    }
    this.lastAutoReplyAt.set(from, now);

    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (!phoneNumberId || !accessToken) {
      return;
    }

    try {
      await this.whatsapp.sendTextMessage(phoneNumberId, accessToken, from, AUTO_REPLY_TEXT);
    } catch (error) {
      this.logger.error(
        `Could not send WhatsApp auto-reply: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
