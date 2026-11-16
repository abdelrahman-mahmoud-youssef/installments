import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { authenticator } from 'otplib';
import { DEACTIVATED_ACCOUNT_MESSAGE } from '../../common/constants';
import { encrypt } from '../../common/crypto';
import { hashPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { AccountDeletionService } from './account-deletion.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

const JWT_SECRET = 'e2e-jwt-secret-that-is-long-enough';
const TWO_FACTOR_KEY = 'e2e-two-factor-key-that-is-long-enough';
const PASSWORD = 'correct-horse-battery';
const TOMORROW_MS = 86_400_000;
const RECENT_MS = 60_000;

interface ShopFixture {
  tenantId: string;
  ownerId: string;
  staffId: string;
  ownerEmail: string;
  staffEmail: string;
}

describe('DELETE /auth/account', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let staffManagement: UsersService;
  let baseUrl: string;

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET, TWO_FACTOR_ENCRYPTION_KEY: TWO_FACTOR_KEY })],
        }),
      ],
      controllers: [AuthController],
      providers: [
        PrismaService,
        AuthService,
        AccountDeletionService,
        UsersService,
        JwtStrategy,
        { provide: MailService, useValue: {} },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    staffManagement = app.get(UsersService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  async function createShop(options: { ownerTwoFactorSecret?: string } = {}): Promise<ShopFixture> {
    const suffix = randomUUID();
    const passwordHash = await hashPassword(PASSWORD);
    const tenant = await prisma.tenant.create({
      data: {
        name: `Shop ${suffix}`,
        slug: `shop-${suffix}`,
        subscriptionExpiresOn: new Date(Date.now() + 30 * TOMORROW_MS),
      },
    });
    const owner = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Owner',
        email: `owner-${suffix}@example.com`,
        passwordHash,
        role: Role.ADMIN,
        twoFactorEnabled: Boolean(options.ownerTwoFactorSecret),
        twoFactorSecret: options.ownerTwoFactorSecret ? encrypt(options.ownerTwoFactorSecret, TWO_FACTOR_KEY) : null,
      },
    });
    const staff = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Staff',
        email: `staff-${suffix}@example.com`,
        passwordHash,
        role: Role.STAFF,
      },
    });
    await prisma.customer.create({ data: { tenantId: tenant.id, name: 'Customer', phone: '01000000000' } });
    await prisma.pushDevice.createMany({
      data: [
        { tenantId: tenant.id, userId: owner.id, token: `ExponentPushToken[owner-${suffix}]` },
        { tenantId: tenant.id, userId: staff.id, token: `ExponentPushToken[staff-${suffix}]` },
      ],
    });
    return {
      tenantId: tenant.id,
      ownerId: owner.id,
      staffId: staff.id,
      ownerEmail: owner.email,
      staffEmail: staff.email,
    };
  }

  function tokenFor(userId: string, tenantId: string, role: Role, email: string): Promise<string> {
    return jwt.signAsync({ sub: userId, tenantId, role, email, name: email });
  }

  async function requestDeletion(token: string | null, body: unknown): Promise<Response> {
    return fetch(`${baseUrl}/auth/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  }

  it('rejects an unauthenticated request', async () => {
    const response = await requestDeletion(null, { password: PASSWORD });

    expect(response.status).toBe(401);
  });

  it('rejects a platform admin token', async () => {
    const platformToken = await jwt.signAsync({ sub: randomUUID(), scope: 'platform', email: 'a@b.c', name: 'Admin' });

    const response = await requestDeletion(platformToken, { password: PASSWORD });

    expect(response.status).toBe(401);
  });

  it('rejects a wrong password and leaves the account active', async () => {
    const shop = await createShop();
    const token = await tokenFor(shop.staffId, shop.tenantId, Role.STAFF, shop.staffEmail);

    const response = await requestDeletion(token, { password: 'not-the-password' });

    expect(response.status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } })).isActive).toBe(true);
  });

  describe('when two-factor authentication is enabled', () => {
    const secret = authenticator.generateSecret();

    it('requires a code', async () => {
      const shop = await createShop({ ownerTwoFactorSecret: secret });
      const token = await tokenFor(shop.ownerId, shop.tenantId, Role.ADMIN, shop.ownerEmail);

      const response = await requestDeletion(token, { password: PASSWORD });

      expect(response.status).toBe(400);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: shop.ownerId } })).isActive).toBe(true);
    });

    it('rejects a wrong code', async () => {
      const shop = await createShop({ ownerTwoFactorSecret: secret });
      const token = await tokenFor(shop.ownerId, shop.tenantId, Role.ADMIN, shop.ownerEmail);

      const response = await requestDeletion(token, { password: PASSWORD, code: '000000' });

      expect(response.status).toBe(400);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: shop.ownerId } })).isActive).toBe(true);
    });

    it('accepts a valid code', async () => {
      const shop = await createShop({ ownerTwoFactorSecret: secret });
      const token = await tokenFor(shop.ownerId, shop.tenantId, Role.ADMIN, shop.ownerEmail);

      const response = await requestDeletion(token, { password: PASSWORD, code: authenticator.generate(secret) });

      expect(response.status).toBe(204);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: shop.ownerId } })).isActive).toBe(false);
    });
  });

  it('deactivates only the staff member when staff delete their account', async () => {
    const shop = await createShop();
    const token = await tokenFor(shop.staffId, shop.tenantId, Role.STAFF, shop.staffEmail);

    const response = await requestDeletion(token, { password: PASSWORD });

    expect(response.status).toBe(204);
    const staff = await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } });
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: shop.ownerId } });
    expect(staff.isActive).toBe(false);
    expect(Date.now() - (staff.deactivatedAt?.getTime() ?? 0)).toBeLessThan(RECENT_MS);
    expect(owner.isActive).toBe(true);
    expect(owner.deactivatedAt).toBeNull();
    expect(await prisma.pushDevice.count({ where: { userId: shop.staffId } })).toBe(0);
    expect(await prisma.pushDevice.count({ where: { userId: shop.ownerId } })).toBe(1);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: shop.tenantId } });
    expect(tenant.subscriptionExpiresOn.getTime()).toBeGreaterThan(Date.now());
    expect(await prisma.customer.count({ where: { tenantId: shop.tenantId } })).toBe(1);
  });

  it('deactivates every user of the shop and keeps its records when the owner deletes their account', async () => {
    const shop = await createShop();
    const other = await createShop();
    const token = await tokenFor(shop.ownerId, shop.tenantId, Role.ADMIN, shop.ownerEmail);

    const response = await requestDeletion(token, { password: PASSWORD });

    expect(response.status).toBe(204);
    const users = await prisma.user.findMany({ where: { tenantId: shop.tenantId } });
    expect(users).toHaveLength(2);
    expect(users.every((user) => !user.isActive)).toBe(true);
    expect(users.every((user) => Date.now() - (user.deactivatedAt?.getTime() ?? 0) < RECENT_MS)).toBe(true);
    expect(await prisma.pushDevice.count({ where: { tenantId: shop.tenantId } })).toBe(0);
    expect(await prisma.customer.count({ where: { tenantId: shop.tenantId } })).toBe(1);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: shop.tenantId } });
    expect(tenant.subscriptionExpiresOn.getTime()).toBeLessThanOrEqual(Date.now());
    const otherUsers = await prisma.user.findMany({ where: { tenantId: other.tenantId } });
    expect(otherUsers.every((user) => user.isActive)).toBe(true);
    expect(await prisma.pushDevice.count({ where: { tenantId: other.tenantId } })).toBe(2);
  });

  it('rejects the old token after the account is deactivated', async () => {
    const shop = await createShop();
    const token = await tokenFor(shop.staffId, shop.tenantId, Role.STAFF, shop.staffEmail);
    await requestDeletion(token, { password: PASSWORD });

    const response = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

    expect(response.status).toBe(401);
  });

  it('keeps the deactivation time consistent when an owner manages staff', async () => {
    const shop = await createShop();

    await staffManagement.updateStaff(shop.tenantId, shop.ownerId, shop.staffId, { isActive: false });
    const deactivated = await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } });
    await staffManagement.updateStaff(shop.tenantId, shop.ownerId, shop.staffId, { isActive: false });
    const deactivatedAgain = await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } });
    await staffManagement.updateStaff(shop.tenantId, shop.ownerId, shop.staffId, { isActive: true });
    const reactivated = await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } });

    expect(deactivated.deactivatedAt).not.toBeNull();
    expect(deactivatedAgain.deactivatedAt).toEqual(deactivated.deactivatedAt);
    expect(reactivated.isActive).toBe(true);
    expect(reactivated.deactivatedAt).toBeNull();
  });

  it('keeps the earlier deactivation time of a staff member when the owner later deletes the shop', async () => {
    const shop = await createShop();
    await staffManagement.updateStaff(shop.tenantId, shop.ownerId, shop.staffId, { isActive: false });
    const staffDeactivatedAt = (await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } })).deactivatedAt;
    const token = await tokenFor(shop.ownerId, shop.tenantId, Role.ADMIN, shop.ownerEmail);

    await requestDeletion(token, { password: PASSWORD });

    const staff = await prisma.user.findUniqueOrThrow({ where: { id: shop.staffId } });
    expect(staff.deactivatedAt).toEqual(staffDeactivatedAt);
  });

  it('tells a deactivated user to contact support when they try to sign in', async () => {
    const shop = await createShop();
    const token = await tokenFor(shop.staffId, shop.tenantId, Role.STAFF, shop.staffEmail);
    await requestDeletion(token, { password: PASSWORD });

    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: shop.staffEmail, password: PASSWORD }),
    });

    expect(response.status).toBe(401);
    expect(((await response.json()) as { message: string }).message).toBe(DEACTIVATED_ACCOUNT_MESSAGE);
  });
});
