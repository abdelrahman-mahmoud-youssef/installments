import { Injectable } from '@nestjs/common';

interface TelegramUpdate {
  message?: { chat?: { id?: number } };
}

interface TelegramUpdatesResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

@Injectable()
export class TelegramService {
  async sendMessage(botToken: string, chatId: string, text: string): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API error ${response.status}: ${body}`);
    }
  }

  async getMostRecentChatId(botToken: string): Promise<string | null> {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as TelegramUpdatesResponse;
    for (const update of [...data.result].reverse()) {
      const chatId = update.message?.chat?.id;
      if (chatId !== undefined) {
        return String(chatId);
      }
    }
    return null;
  }
}
