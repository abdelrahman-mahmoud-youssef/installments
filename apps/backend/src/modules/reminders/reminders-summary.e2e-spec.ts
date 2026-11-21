import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NotificationLanguage, RecurrenceType, Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { JameyasService } from '../jameyas/jameyas.service';
import { PushService } from '../push/push.service';
import { PushContent } from '../push/push.types';
import { ShareLinksService } from '../share-links/share-links.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { REMINDERS_QUEUE, RemindersService } from './reminders.service';

describe('Morning summary with jameya totals', () => {
  let prisma: PrismaService;
  let reminders: RemindersService;
  let jameyas: JameyasService;
  const sendToTenantAdmins = jest.fn().mockResolvedValue(1);
  const sendTelegramMessage = jest.fn().mockResolvedValue(undefined);
  const today = getUtcToday();

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        RemindersService,
        JameyasService,
        { provide: getQueueToken(REMINDERS_QUEUE), useValue: { add: jest.fn() } },
        { provide: ConfigService, useValue: { get: () => undefined, getOrThrow: () => 8 } },
        { provide: TelegramService, useValue: { sendMessage: sendTelegramMessage } },
        { provide: WhatsappService, useValue: {} },
        { provide: ShareLinksService, useValue: {} },
        { provide: PushService, useValue: { sendToTenantAdmins } },
      ],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    reminders = moduleRef.get(RemindersService);
    jameyas = moduleRef.get(JameyasService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShopWithLateJameya(jameyaEnabled: boolean): Promise<{ tenantId: string; chatId: string }> {
    const suffix = randomUUID();
    const chatId = `chat-${suffix}`;
    const tenant = await prisma.tenant.create({
      data: {
        name: `Shop ${suffix}`,
        slug: `shop-${suffix}`,
        subscriptionExpiresOn: addUtcDays(today, 30),
        jameyaEnabled,
        telegramBotToken: `token-${suffix}`,
        telegramChatId: chatId,
        notificationLanguage: NotificationLanguage.EN,
      },
    });
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Owner',
        email: `owner-${suffix}@example.com`,
        passwordHash: 'x',
        role: Role.ADMIN,
      },
    });
    await prisma.pushDevice.create({ data: { tenantId: tenant.id, userId: admin.id, token: `push-${suffix}` } });
    const customers = await prisma.customer.createManyAndReturn({
      data: [1, 2].map((index) => ({ tenantId: tenant.id, name: `Member ${index}`, phone: `010000000${index}` })),
      select: { id: true },
    });
    await jameyas.create(tenant.id, {
      name: 'Circle',
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: addUtcDays(today, -40).toISOString().slice(0, 10),
      graceDays: 0,
      customerIds: customers.map((customer) => customer.id),
    });
    return { tenantId: tenant.id, chatId };
  }

  it('adds the jameya lines to the push and Telegram summaries only for shops with jameya on', async () => {
    const enabled = await createShopWithLateJameya(true);
    const disabled = await createShopWithLateJameya(false);

    await reminders.sendMorningSummaryPushForAllTenants();
    await reminders.sendRemindersForAllTenants();

    const pushCall = sendToTenantAdmins.mock.calls.find(([tenantId]) => tenantId === enabled.tenantId);
    const push = (pushCall?.[1] as (language: NotificationLanguage) => PushContent)(NotificationLanguage.EN);
    expect(push).toEqual({
      title: 'Today’s jameyas',
      body: 'Late jameya payments: 4\nJameya payouts pending: 2',
    });
    expect(sendToTenantAdmins.mock.calls.some(([tenantId]) => tenantId === disabled.tenantId)).toBe(false);

    const telegramText = (chatId: string) =>
      sendTelegramMessage.mock.calls.find(([, chat]) => chat === chatId)?.[2] as string;
    expect(telegramText(enabled.chatId).split('\n').slice(-3)).toEqual([
      '',
      'Late jameya payments: 4',
      'Jameya payouts pending: 2',
    ]);
    expect(telegramText(disabled.chatId)).not.toMatch(/jameya/i);
  });
});
