import { NotificationLanguage, Role } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { ExpoPushClient, ExpoPushMessage } from './expo-push.client';
import { PushService } from './push.service';
import { PushRoute } from './push.types';

describe('PushService.sendToTenantAdmins', () => {
  let prisma: PrismaService;
  let pushService: PushService;
  const sent: ExpoPushMessage[] = [];

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        PushService,
        {
          provide: ExpoPushClient,
          useValue: {
            send: async (messages: ExpoPushMessage[]) => {
              sent.push(...messages);
              return [];
            },
          },
        },
      ],
    }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    pushService = moduleRef.get(PushService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShopWithDevices(): Promise<{ tenantId: string; adminToken: string; staffToken: string }> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: { name: `Shop ${suffix}`, slug: `shop-${suffix}`, subscriptionExpiresOn: new Date('2099-01-01') },
    });
    const [admin, staff] = await Promise.all(
      [Role.ADMIN, Role.STAFF].map((role) =>
        prisma.user.create({
          data: { tenantId: tenant.id, name: role, email: `${role}-${suffix}@example.com`, passwordHash: 'x', role },
        }),
      ),
    );
    const adminToken = `ExponentPushToken[admin-${suffix}]`;
    const staffToken = `ExponentPushToken[staff-${suffix}]`;
    await prisma.pushDevice.createMany({
      data: [
        { tenantId: tenant.id, userId: admin.id, token: adminToken, language: NotificationLanguage.AR },
        { tenantId: tenant.id, userId: staff.id, token: staffToken, language: NotificationLanguage.EN },
      ],
    });
    return { tenantId: tenant.id, adminToken, staffToken };
  }

  it('sends only to the shop admins, in each device language', async () => {
    const shop = await createShopWithDevices();
    const otherShop = await createShopWithDevices();
    sent.length = 0;

    const recipients = await pushService.sendToTenantAdmins(
      shop.tenantId,
      (language) => ({ title: language, body: language }),
      PushRoute.DASHBOARD,
    );

    expect(recipients).toBe(1);
    expect(sent).toEqual([
      { to: shop.adminToken, title: 'AR', body: 'AR', sound: 'default', data: { route: PushRoute.DASHBOARD } },
    ]);
    expect(sent.map((message) => message.to)).not.toContain(shop.staffToken);
    expect(sent.map((message) => message.to)).not.toContain(otherShop.adminToken);
  });
});
