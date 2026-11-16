import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappService } from './whatsapp.service';

const APP_SECRET = 'meta-app-secret';

function sign(body: string, secret: string = APP_SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

const payload = JSON.stringify({
  entry: [{ changes: [{ value: { messages: [{ id: 'wamid.1', from: '201001234567', type: 'text', text: { body: 'hello' } }] } }] }],
});

async function createApp(configuredSecret: string | undefined) {
  const prisma = { whatsappMessage: { createMany: jest.fn().mockResolvedValue({ count: 1 }) } };
  const whatsapp = { sendTextMessage: jest.fn().mockResolvedValue(undefined) };
  const settings: Record<string, string | undefined> = {
    WHATSAPP_APP_SECRET: configuredSecret,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [WhatsappWebhookController],
    providers: [
      { provide: ConfigService, useValue: { get: (key: string) => settings[key] } },
      { provide: PrismaService, useValue: prisma },
      { provide: WhatsappService, useValue: whatsapp },
    ],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true, logger: false });
  app.useBodyParser('json', { limit: '10mb' });
  await app.listen(0);
  return { app, prisma, url: `${await app.getUrl()}/whatsapp/webhook` };
}

function post(url: string, body: string, signature?: string): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(signature ? { 'X-Hub-Signature-256': signature } : {}) },
    body,
  });
}

describe('WhatsappWebhookController POST /whatsapp/webhook', () => {
  it('stores the message when Meta signed the request', async () => {
    const { app, prisma, url } = await createApp(APP_SECRET);

    const response = await post(url, payload, sign(payload));

    expect(response.status).toBe(200);
    expect(prisma.whatsappMessage.createMany).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('rejects a request with no signature and stores nothing', async () => {
    const { app, prisma, url } = await createApp(APP_SECRET);

    const response = await post(url, payload);

    expect(response.status).toBe(403);
    expect(prisma.whatsappMessage.createMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a request signed with a different secret', async () => {
    const { app, prisma, url } = await createApp(APP_SECRET);

    const response = await post(url, payload, sign(payload, 'attacker-secret'));

    expect(response.status).toBe(403);
    expect(prisma.whatsappMessage.createMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects a body that was changed after it was signed', async () => {
    const { app, prisma, url } = await createApp(APP_SECRET);

    const response = await post(url, payload.replace('hello', 'forged'), sign(payload));

    expect(response.status).toBe(403);
    expect(prisma.whatsappMessage.createMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects every request when the app secret is not configured', async () => {
    const { app, prisma, url } = await createApp(undefined);

    const response = await post(url, payload, sign(payload));

    expect(response.status).toBe(403);
    expect(prisma.whatsappMessage.createMany).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('WhatsappWebhookController GET /whatsapp/webhook', () => {
  it('still answers Meta verification challenges with the verify token', async () => {
    const { app, url } = await createApp(APP_SECRET);

    const response = await fetch(`${url}?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=12345`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('12345');
    await app.close();
  });
});
