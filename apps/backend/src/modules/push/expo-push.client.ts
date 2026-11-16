import { Injectable, Logger } from '@nestjs/common';
import { EXPO_PUSH_BATCH_SIZE, EXPO_PUSH_URL } from '../../common/constants';
import { PushRoute } from './push.types';

const DEVICE_NOT_REGISTERED_ERROR = 'DeviceNotRegistered';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: { route: PushRoute };
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);

  async send(messages: ExpoPushMessage[]): Promise<string[]> {
    const unregisteredTokens: string[] = [];
    for (const batch of chunk(messages, EXPO_PUSH_BATCH_SIZE)) {
      unregisteredTokens.push(...(await this.sendBatch(batch)));
    }
    return unregisteredTokens;
  }

  private async sendBatch(batch: ExpoPushMessage[]): Promise<string[]> {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!response.ok) {
        this.logger.error(`Expo push request failed with status ${response.status}.`);
        return [];
      }
      const { data: tickets } = (await response.json()) as ExpoPushResponse;
      return batch
        .filter((_, index) => tickets[index]?.details?.error === DEVICE_NOT_REGISTERED_ERROR)
        .map((message) => message.to);
    } catch (error) {
      this.logger.error(`Expo push request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return [];
    }
  }
}
