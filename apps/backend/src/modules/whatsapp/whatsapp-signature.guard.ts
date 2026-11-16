import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyWhatsappSignature } from './whatsapp-signature';

const SIGNATURE_HEADER = 'x-hub-signature-256';

@Injectable()
export class WhatsappSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WhatsappSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) {
      this.logger.error('WHATSAPP_APP_SECRET is not set, so every WhatsApp webhook call is rejected.');
      throw new ForbiddenException('WhatsApp webhook signature cannot be verified.');
    }

    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const isValid =
      request.rawBody !== undefined && verifyWhatsappSignature(request.rawBody, request.header(SIGNATURE_HEADER), appSecret);
    if (!isValid) {
      throw new ForbiddenException('Invalid WhatsApp webhook signature.');
    }
    return true;
  }
}
