import { NotificationLanguage, Role } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { ExpoPushClient, ExpoPushMessage } from '../push/expo-push.client';
import { PushService } from '../push/push.service';
import { PushRoute } from '../push/push.types';
import { StaffActivityPushService } from '../push/staff-activity-push.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService staff activity notifications', () => {
  let prisma: PrismaService;
  let auditLogService: AuditLogService;
  const sent: ExpoPushMessage[] = [];

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        PushService,
        StaffActivityPushService,
        AuditLogService,
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
    auditLogService = moduleRef.get(AuditLogService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShop() {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: { name: `Shop ${suffix}`, slug: `shop-${suffix}`, subscriptionExpiresOn: new Date('2099-01-01') },
    });
    const [admin, staff] = await Promise.all(
      [Role.ADMIN, Role.STAFF].map((role) =>
        prisma.user.create({
          data: { tenantId: tenant.id, name: `${role} user`, email: `${role}-${suffix}@example.com`, passwordHash: 'x', role },
        }),
      ),
    );
    const adminToken = `ExponentPushToken[admin-${suffix}]`;
    await prisma.pushDevice.createMany({
      data: [
        { tenantId: tenant.id, userId: admin.id, token: adminToken, language: NotificationLanguage.EN },
        { tenantId: tenant.id, userId: staff.id, token: `ExponentPushToken[staff-${suffix}]` },
      ],
    });
    return { tenantId: tenant.id, admin, staff, adminToken };
  }

  it('notifies the shop admins when a staff member acts', async () => {
    const shop = await createShop();
    sent.length = 0;

    await auditLogService.record(
      shop.tenantId,
      { id: shop.staff.id, name: 'Ahmed', email: shop.staff.email, role: Role.STAFF },
      'payment.create',
      'Payment',
      null,
    );

    expect(sent).toEqual([
      {
        to: shop.adminToken,
        title: 'Staff activity',
        body: 'Ahmed: Recorded payment',
        sound: 'default',
        data: { route: PushRoute.ACTIVITY },
      },
    ]);
    expect(await prisma.auditLog.count({ where: { tenantId: shop.tenantId, action: 'payment.create' } })).toBe(1);
  });

  it('sends nothing when an admin acts', async () => {
    const shop = await createShop();
    sent.length = 0;

    await auditLogService.record(
      shop.tenantId,
      { id: shop.admin.id, name: 'Owner', email: shop.admin.email, role: Role.ADMIN },
      'customer.create',
      'Customer',
      null,
    );

    expect(sent).toEqual([]);
    expect(await prisma.auditLog.count({ where: { tenantId: shop.tenantId, action: 'customer.create' } })).toBe(1);
  });
});
