import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PLATFORM_TOKEN_SCOPE } from '../../common/decorators/current-platform-admin.decorator';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SubscriptionActivationService } from '../platform/billing/subscription-activation.service';
import { PlatformJwtStrategy } from '../platform/platform-jwt.strategy';
import { PlatformTenantsController } from '../platform/platform-tenants.controller';
import { PlatformTenantsService } from '../platform/platform-tenants.service';
import { JameyaPaymentsService } from './jameya-payments.service';
import { JameyaPayoutsService } from './jameya-payouts.service';
import { JameyasController } from './jameyas.controller';
import { JameyasService } from './jameyas.service';

const JWT_SECRET = 'e2e-jwt-secret-that-is-long-enough';

interface ShopAccounts {
  tenantId: string;
  adminToken: string;
  staffToken: string;
  customerIds: string[];
}

describe('Jameya routes access', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let baseUrl: string;
  const today = getUtcToday();

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ JWT_SECRET })] }),
      ],
      controllers: [JameyasController, PlatformTenantsController],
      providers: [
        PrismaService,
        JameyasService,
        JameyaPaymentsService,
        { provide: StorageService, useValue: {} },
        JameyaPayoutsService,
        PlatformTenantsService,
        SubscriptionActivationService,
        JwtStrategy,
        PlatformJwtStrategy,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  function request(token: string, method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function signUser(tenantId: string, role: Role): Promise<string> {
    const user = await prisma.user.create({
      data: { tenantId, name: role, email: `${role}-${randomUUID()}@example.com`, passwordHash: 'x', role },
    });
    return jwt.signAsync({ sub: user.id, tenantId, role, email: user.email, name: user.name });
  }

  async function createShop(jameyaEnabled: boolean): Promise<ShopAccounts> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Shop ${suffix}`,
        slug: `shop-${suffix}`,
        subscriptionExpiresOn: addUtcDays(today, 30),
        jameyaEnabled,
      },
    });
    const customers = await prisma.customer.createManyAndReturn({
      data: [1, 2].map((index) => ({ tenantId: tenant.id, name: `Member ${index}`, phone: `010000000${index}` })),
      select: { id: true },
    });
    return {
      tenantId: tenant.id,
      adminToken: await signUser(tenant.id, Role.ADMIN),
      staffToken: await signUser(tenant.id, Role.STAFF),
      customerIds: customers.map((customer) => customer.id),
    };
  }

  function jameyaBody(shop: ShopAccounts) {
    return {
      name: 'Circle',
      shareAmount: 100_000,
      recurrenceType: 'MONTHLY',
      firstDueDate: addUtcDays(today, -1).toISOString().slice(0, 10),
      graceDays: 2,
      customerIds: shop.customerIds,
    };
  }

  async function createJameya(shop: ShopAccounts): Promise<{ id: string; cycleId: string }> {
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
          holders: [{ customerId: shop.customerIds[0], halves: 2, entitlementAmount: 200_000 }],
        },
        { sequence: 2, holders: [{ customerId: shop.customerIds[1], halves: 2, entitlementAmount: 200_000 }] },
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
