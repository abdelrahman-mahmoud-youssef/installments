import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../common/date/utc-date';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { JwtStrategy } from '../modules/auth/jwt.strategy';
import { JameyaPaymentsService } from '../modules/jameyas/jameya-payments.service';
import { JameyaPayoutsService } from '../modules/jameyas/jameya-payouts.service';
import { JameyasController } from '../modules/jameyas/jameyas.controller';
import { JameyasService } from '../modules/jameyas/jameyas.service';
import { SubscriptionActivationService } from '../modules/platform/billing/subscription-activation.service';
import { PlatformJwtStrategy } from '../modules/platform/platform-jwt.strategy';
import { PlatformTenantsController } from '../modules/platform/platform-tenants.controller';
import { PlatformTenantsService } from '../modules/platform/platform-tenants.service';
import { StorageService } from '../modules/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { prepareTestDatabase } from './test-database';

const JWT_SECRET = 'e2e-jwt-secret-that-is-long-enough';

export interface JameyaTestShop {
  tenantId: string;
  adminToken: string;
  staffToken: string;
  customerIds: string[];
}

export interface JameyaHttpApp {
  app: INestApplication;
  prisma: PrismaService;
  jwt: JwtService;
  request: (token: string, method: string, path: string, body?: unknown) => Promise<Response>;
  createShop: (options: { jameyaEnabled: boolean; memberCount: number }) => Promise<JameyaTestShop>;
}

export async function startJameyaHttpApp(): Promise<JameyaHttpApp> {
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
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  await app.listen(0);
  const baseUrl = await app.getUrl();
  const prisma = app.get(PrismaService);
  const jwt = app.get(JwtService);

  const request = (token: string, method: string, path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  const signUser = async (tenantId: string, role: Role) => {
    const user = await prisma.user.create({
      data: { tenantId, name: role, email: `${role}-${randomUUID()}@example.com`, passwordHash: 'x', role },
    });
    return jwt.signAsync({ sub: user.id, tenantId, role, email: user.email, name: user.name });
  };

  const createShop = async ({ jameyaEnabled, memberCount }: { jameyaEnabled: boolean; memberCount: number }) => {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Shop ${suffix}`,
        slug: `shop-${suffix}`,
        subscriptionExpiresOn: addUtcDays(getUtcToday(), 30),
        jameyaEnabled,
      },
    });
    const customers = await prisma.customer.createManyAndReturn({
      data: Array.from({ length: memberCount }, (_, index) => ({
        tenantId: tenant.id,
        name: `Member ${index + 1}`,
        phone: `0100000${String(index + 1).padStart(4, '0')}`,
      })),
      select: { id: true },
    });
    return {
      tenantId: tenant.id,
      adminToken: await signUser(tenant.id, Role.ADMIN),
      staffToken: await signUser(tenant.id, Role.STAFF),
      customerIds: customers.map((customer) => customer.id),
    };
  };

  return { app, prisma, jwt, request, createShop };
}
