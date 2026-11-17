import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PLATFORM_TOKEN_SCOPE } from '../../../common/decorators/current-platform-admin.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { prepareTestDatabase } from '../../../test-support/test-database';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { PlatformJwtStrategy } from '../platform-jwt.strategy';
import { PlatformTenantsController } from '../platform-tenants.controller';
import { PlatformTenantsService } from '../platform-tenants.service';
import { SubscriptionActivationService } from './subscription-activation.service';
import { SubscriptionOffersController } from './subscription-offers.controller';
import { SubscriptionOffersService } from './subscription-offers.service';
import { SubscriptionPaymentsController } from './subscription-payments.controller';
import { SubscriptionPaymentsService } from './subscription-payments.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlansService } from './subscription-plans.service';

const JWT_SECRET = 'e2e-jwt-secret-that-is-long-enough';

describe('Platform billing routes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let baseUrl: string;

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ JWT_SECRET })] }),
      ],
      controllers: [
        PlatformTenantsController,
        SubscriptionPlansController,
        SubscriptionOffersController,
        SubscriptionPaymentsController,
      ],
      providers: [
        PrismaService,
        PlatformTenantsService,
        SubscriptionActivationService,
        SubscriptionPlansService,
        SubscriptionOffersService,
        SubscriptionPaymentsService,
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

  async function shopAdminToken(): Promise<{ token: string; tenantId: string }> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: { name: `Shop ${suffix}`, slug: `shop-${suffix}`, subscriptionExpiresOn: new Date('2099-01-01') },
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
    const token = await jwt.signAsync({
      sub: admin.id,
      tenantId: tenant.id,
      role: Role.ADMIN,
      email: admin.email,
      name: admin.name,
    });
    return { token, tenantId: tenant.id };
  }

  async function platformToken(): Promise<string> {
    const admin = await prisma.platformAdmin.create({
      data: { name: 'Owner', email: `platform-${randomUUID()}@example.com`, passwordHash: 'x' },
    });
    return jwt.signAsync({ sub: admin.id, scope: PLATFORM_TOKEN_SCOPE, email: admin.email, name: admin.name });
  }

  it('shuts shop accounts out of plans, offers, payments and activation', async () => {
    const shop = await shopAdminToken();

    const responses = await Promise.all([
      request(shop.token, 'GET', '/platform/subscription-plans'),
      request(shop.token, 'PATCH', '/platform/subscription-plans/plan_monthly', { price: 1 }),
      request(shop.token, 'POST', '/platform/subscription-offers', {}),
      request(shop.token, 'GET', '/platform/payments'),
      request(shop.token, 'POST', `/platform/tenants/${shop.tenantId}/activate`, {
        source: 'MANUAL',
        months: 12,
        amount: 0,
        paymentMethod: 'FREE',
      }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);
    const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: 'plan_monthly' } });
    expect(plan.price).toBe(20_000);
    expect(await prisma.tenantSubscription.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  it('lets the platform owner read plans and rejects an activation in the old format', async () => {
    const token = await platformToken();
    const shop = await shopAdminToken();

    const plans = await request(token, 'GET', '/platform/subscription-plans');
    expect(plans.status).toBe(200);

    const oldFormat = await request(token, 'POST', `/platform/tenants/${shop.tenantId}/activate`, {
      pricing: 'STANDARD',
    });
    expect(oldFormat.status).toBe(400);
  });
});
