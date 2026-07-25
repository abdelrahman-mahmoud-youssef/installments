import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendEmail(input: SendEmailInput): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY', '');
    const fromAddress = this.config.get<string>('RESEND_FROM_EMAIL', '');
    if (!apiKey || !fromAddress) {
      throw new Error('RESEND_API_KEY / RESEND_FROM_EMAIL is not configured.');
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
  }
}
