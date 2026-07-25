import { Injectable } from '@nestjs/common';

const GRAPH_API_VERSION = 'v22.0';

interface TemplateComponent {
  type: 'body' | 'button';
  sub_type?: 'url';
  index?: string;
  parameters: { type: 'text'; text: string }[];
}

@Injectable()
export class WhatsappService {
  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode: string,
    bodyParams: string[] = [],
    buttonUrlParam?: string,
  ): Promise<void> {
    const components: TemplateComponent[] = [];
    if (bodyParams.length > 0) {
      components.push({ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) });
    }
    if (buttonUrlParam) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: buttonUrlParam }],
      });
    }

    await this.postMessage(phoneNumberId, accessToken, {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 && { components }),
      },
    });
  }

  async sendTextMessage(phoneNumberId: string, accessToken: string, to: string, body: string): Promise<void> {
    await this.postMessage(phoneNumberId, accessToken, {
      to,
      type: 'text',
      text: { body },
    });
  }

  private async postMessage(
    phoneNumberId: string,
    accessToken: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WhatsApp API error ${response.status}: ${body}`);
    }
  }
}
