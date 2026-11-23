import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PLATFORM_TOKEN_SCOPE } from '../../common/decorators/current-platform-admin.decorator';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { JameyaHttpApp, JameyaTestShop, startJameyaHttpApp } from '../../test-support/jameya-http-app';

describe('Jameya routes access', () => {
  let harness: JameyaHttpApp;
  let prisma: PrismaService;
  let jwt: JwtService;
  const today = getUtcToday();

  beforeAll(async () => {
    harness = await startJameyaHttpApp();
    prisma = harness.prisma;
    jwt = harness.jwt;
  }, 120_000);

  afterAll(async () => {
    await harness.app.close();
  });

  function request(token: string, method: string, path: string, body?: unknown): Promise<Response> {
    return harness.request(token, method, path, body);
  }

  function createShop(jameyaEnabled: boolean): Promise<JameyaTestShop> {
    return harness.createShop({ jameyaEnabled, memberCount: 2 });
  }

  function jameyaBody(shop: JameyaTestShop) {
    return {
      name: 'Circle',
      shareAmount: 100_000,
      recurrenceType: 'MONTHLY',
      firstDueDate: addUtcDays(today, -1).toISOString().slice(0, 10),
      graceDays: 2,
      customerIds: shop.customerIds,
    };
  }

  async function createJameya(shop: JameyaTestShop): Promise<{ id: string; cycleId: string }> {
    const response = await request(shop.adminToken, 'POST', '/jameyas', jameyaBody(shop));
    expect(response.status).toBe(201);
    const jameya = (await response.json()) as { id: string; cycles: { id: string }[] };
    return { id: jameya.id, cycleId: jameya.cycles[0].id };
  }

  function routesFor(jameya: { id: string; cycleId: string }, customerId: string) {
    return [
      ['GET', `/jameyas/${jameya.id}`, undefined],
      ['PATCH', `/jameyas/${jameya.id}`, { name: 'Renamed' }],
      ['POST', `/jameyas/${jameya.id}/payments`, { customerId, amount: 1_000, clientRequestId: randomUUID() }],
      ['GET', `/jameyas/${jameya.id}/payments`, undefined],
      [
        'POST',
        `/jameyas/${jameya.id}/cycles/${jameya.cycleId}/payouts`,
        { customerId, amount: 1_000, clientRequestId: randomUUID() },
      ],
    ] as const;
  }

  it('previews the frozen schedule without writing anything', async () => {
    const shop = await createShop(true);

    const response = await request(shop.staffToken, 'POST', '/jameyas/preview', jameyaBody(shop));

    expect(response.status).toBe(200);
    const firstDueDate = addUtcDays(today, -1);
    expect(await response.json()).toMatchObject({
      potAmount: 200_000,
      cycles: [
        {
          sequence: 1,
          dueDate: firstDueDate.toISOString(),
          lateAfter: addUtcDays(firstDueDate, 2).toISOString(),
          holders: [{ customerId: shop.customerIds[0], contribution: 100_000, entitlementAmount: 200_000 }],
        },
        {
          sequence: 2,
          holders: [{ customerId: shop.customerIds[1], contribution: 100_000, entitlementAmount: 200_000 }],
        },
      ],
      dueAmounts: shop.customerIds.map((customerId) => ({ customerId, amount: 100_000 })),
    });
    expect(await prisma.jameya.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  it('lets staff record payments but not pay out or edit', async () => {
    const shop = await createShop(true);
    const jameya = await createJameya(shop);
    const [holder] = shop.customerIds;

    const responses = await Promise.all([
      request(shop.staffToken, 'GET', `/jameyas/${jameya.id}`),
      request(shop.staffToken, 'POST', `/jameyas/${jameya.id}/payments`, {
        customerId: holder,
        amount: 1_000,
        clientRequestId: randomUUID(),
      }),
      request(shop.staffToken, 'PATCH', `/jameyas/${jameya.id}`, { name: 'Renamed' }),
      request(shop.staffToken, 'POST', `/jameyas/${jameya.id}/cycles/${jameya.cycleId}/payouts`, {
        customerId: holder,
        amount: 1_000,
        clientRequestId: randomUUID(),
      }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 201, 403, 403]);
    expect(await prisma.jameyaPayout.count({ where: { jameyaId: jameya.id } })).toBe(0);
  });

  it("answers another shop's token with 404 on every jameya route and changes nothing", async () => {
    const owner = await createShop(true);
    const otherShop = await createShop(true);
    const jameya = await createJameya(owner);

    const responses = await Promise.all(
      routesFor(jameya, owner.customerIds[0]).map(([method, path, body]) =>
        request(otherShop.adminToken, method, path, body),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual([404, 404, 404, 404, 404]);
    const stored = await prisma.jameya.findUniqueOrThrow({ where: { id: jameya.id } });
    expect(stored.name).toBe('Circle');
    expect(await prisma.jameyaPayment.count({ where: { jameyaId: jameya.id } })).toBe(0);
    expect(await prisma.jameyaPayout.count({ where: { jameyaId: jameya.id } })).toBe(0);
  });

  it('answers 403 on every jameya route until the platform owner turns jameya on', async () => {
    const shop = await createShop(false);
    const enabledShop = await createShop(true);
    const jameya = await createJameya(enabledShop);

    const responses = await Promise.all([
      request(shop.adminToken, 'GET', '/jameyas'),
      request(shop.adminToken, 'POST', '/jameyas', {}),
      request(shop.adminToken, 'POST', '/jameyas/preview', jameyaBody(shop)),
      ...routesFor(jameya, enabledShop.customerIds[0]).map(([method, path, body]) =>
        request(shop.adminToken, method, path, body),
      ),
    ]);
    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403, 403]);

    const platformAdmin = await prisma.platformAdmin.create({
      data: { name: 'Owner', email: `platform-${randomUUID()}@example.com`, passwordHash: 'x' },
    });
    const platformToken = await jwt.signAsync({
      sub: platformAdmin.id,
      scope: PLATFORM_TOKEN_SCOPE,
      email: platformAdmin.email,
      name: platformAdmin.name,
    });
    const shopTurnsOnOwnFlag = await request(shop.adminToken, 'PATCH', `/platform/tenants/${shop.tenantId}/features`, {
      jameyaEnabled: true,
    });
    expect(shopTurnsOnOwnFlag.status).toBe(401);

    const toggle = await request(platformToken, 'PATCH', `/platform/tenants/${shop.tenantId}/features`, {
      jameyaEnabled: true,
    });
    expect(toggle.status).toBe(200);
    expect(await toggle.json()).toMatchObject({ id: shop.tenantId, jameyaEnabled: true });
    expect((await request(shop.adminToken, 'GET', '/jameyas')).status).toBe(200);
  });
});
