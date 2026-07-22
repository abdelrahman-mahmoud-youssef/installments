import { Injectable } from '@nestjs/common';

const GRAPH_API_VERSION = 'v22.0';

@Injectable()
export class WhatsappService {
  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode: string,
    params: string[] = [],
  ): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(params.length > 0 && {
              components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
            }),
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WhatsApp API error ${response.status}: ${body}`);
    }
  }
}
