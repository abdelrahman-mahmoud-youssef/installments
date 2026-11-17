import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PaymentDirection, Role, WalletAccess } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { prepareTestDatabase } from '../../../test-support/test-database';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { StorageService } from '../../storage/storage.service';
import { UsersController } from '../../users/users.controller';
import { UsersService } from '../../users/users.service';
import { CounterpartiesController } from '../counterparties.controller';
import { CounterpartiesService } from '../counterparties.service';
import { PaymentMethodLimitService } from '../payment-method-limit.service';
import { PaymentMethodTransactionsController } from '../payment-method-transactions.controller';
import { PaymentMethodTransactionsService } from '../payment-method-transactions.service';
import { PaymentMethodsController } from '../payment-methods.controller';
import { PaymentMethodsService } from '../payment-methods.service';

const JWT_SECRET = 'e2e-jwt-secret-that-is-long-enough';

interface ShopFixture {
  tenantId: string;
  adminToken: string;
  staffId: string;
  staffToken: string;
  cashWalletId: string;
  bankWalletId: string;
  contactId: string;
}

describe('Staff wallet access', () => {
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
        PaymentMethodsController,
        PaymentMethodTransactionsController,
        CounterpartiesController,
        UsersController,
      ],
      providers: [
        PrismaService,
        PaymentMethodsService,
        PaymentMethodTransactionsService,
        CounterpartiesService,
        UsersService,
        JwtStrategy,
        { provide: PaymentMethodLimitService, useValue: { checkAndAlert: async () => undefined } },
        { provide: StorageService, useValue: {} },
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

  async function createShop(): Promise<ShopFixture> {
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
    const [cashWallet, bankWallet] = await Promise.all(
      ['Cash box', 'Bank'].map((label, sortOrder) =>
        prisma.paymentMethod.create({ data: { tenantId: tenant.id, label, details: label, sortOrder } }),
      ),
    );
    const contact = await prisma.counterparty.create({ data: { tenantId: tenant.id, name: 'Supplier' } });
    await prisma.paymentMethodTransaction.createMany({
      data: [cashWallet, bankWallet].map((wallet) => ({
        tenantId: tenant.id,
        paymentMethodId: wallet.id,
        counterpartyId: contact.id,
        direction: PaymentDirection.OUT,
        amount: 1000,
      })),
    });
    const tokenFor = (user: typeof admin) =>
      jwt.signAsync({ sub: user.id, tenantId: tenant.id, role: user.role, email: user.email, name: user.name });
    return {
      tenantId: tenant.id,
      adminToken: await tokenFor(admin),
      staffId: staff.id,
      staffToken: await tokenFor(staff),
      cashWalletId: cashWallet.id,
      bankWalletId: bankWallet.id,
      contactId: contact.id,
    };
  }

  function request(token: string, method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function walletLabels(token: string): Promise<string[]> {
    const response = await request(token, 'GET', '/settings/payment-methods');
    const wallets = (await response.json()) as { label: string }[];
    return wallets.map((wallet) => wallet.label);
  }

  function setAccess(shop: ShopFixture, walletAccess: WalletAccess, paymentMethodIds?: string[]): Promise<Response> {
    return request(shop.adminToken, 'PATCH', `/staff/${shop.staffId}/wallet-access`, {
      walletAccess,
      paymentMethodIds,
    });
  }

  it('keeps wallets and contacts closed to staff by default', async () => {
    const shop = await createShop();

    expect((await request(shop.staffToken, 'GET', '/settings/payment-methods')).status).toBe(403);
    expect((await request(shop.staffToken, 'GET', '/settings/counterparties')).status).toBe(403);
    expect(
      (await request(shop.staffToken, 'GET', `/settings/payment-methods/${shop.cashWalletId}/transactions`)).status,
    ).toBe(403);
  });

  it('shows every wallet once the admin allows all wallets', async () => {
    const shop = await createShop();

    const response = await setAccess(shop, WalletAccess.ALL);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ walletAccess: WalletAccess.ALL, paymentMethodIds: [] });
    expect(await walletLabels(shop.staffToken)).toEqual(['Cash box', 'Bank']);
  });

  it('limits staff to the selected wallets and hides the rest', async () => {
    const shop = await createShop();
    await setAccess(shop, WalletAccess.SELECTED, [shop.cashWalletId]);

    expect(await walletLabels(shop.staffToken)).toEqual(['Cash box']);
    expect(
      (await request(shop.staffToken, 'GET', `/settings/payment-methods/${shop.bankWalletId}/transactions`)).status,
    ).toBe(404);
    expect(
      (
        await request(shop.staffToken, 'POST', `/settings/payment-methods/${shop.bankWalletId}/transactions`, {
          direction: PaymentDirection.IN,
          amount: 500,
        })
      ).status,
    ).toBe(404);

    const history = await request(shop.staffToken, 'GET', `/settings/counterparties/${shop.contactId}/history`);
    const { data } = (await history.json()) as { data: { paymentMethodLabel: string }[] };
    expect(data.map((item) => item.paymentMethodLabel)).toEqual(['Cash box']);
  });

  it('lets staff log a transaction in an allowed wallet but never manage wallets or contacts', async () => {
    const shop = await createShop();
    await setAccess(shop, WalletAccess.ALL);

    const walletPath = `/settings/payment-methods/${shop.cashWalletId}`;
    const contactPath = `/settings/counterparties/${shop.contactId}`;
    const logged = await request(shop.staffToken, 'POST', `${walletPath}/transactions`, {
      direction: PaymentDirection.IN,
      amount: 500,
    });
    expect(logged.status).toBe(201);

    const forbiddenResponses = await Promise.all([
      request(shop.staffToken, 'PATCH', walletPath, { label: 'X' }),
      request(shop.staffToken, 'DELETE', walletPath),
      request(shop.staffToken, 'POST', '/settings/payment-methods', { label: 'X', details: 'X' }),
      request(shop.staffToken, 'PATCH', contactPath, { isPinned: true }),
      request(shop.staffToken, 'DELETE', contactPath),
    ]);
    expect(forbiddenResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });

  it('applies a change of access on the next request', async () => {
    const shop = await createShop();
    await setAccess(shop, WalletAccess.SELECTED, [shop.bankWalletId]);
    expect(await walletLabels(shop.staffToken)).toEqual(['Bank']);

    await setAccess(shop, WalletAccess.NONE);

    expect((await request(shop.staffToken, 'GET', '/settings/payment-methods')).status).toBe(403);
    expect(await prisma.staffWalletGrant.count({ where: { userId: shop.staffId } })).toBe(0);
  });

  it('rejects selecting no wallets or another shop’s wallet', async () => {
    const shop = await createShop();
    const otherShop = await createShop();

    expect((await setAccess(shop, WalletAccess.SELECTED, [])).status).toBe(400);
    expect((await setAccess(shop, WalletAccess.SELECTED, [otherShop.cashWalletId])).status).toBe(400);
    const staffSelfGrant = await request(shop.staffToken, 'PATCH', `/staff/${shop.staffId}/wallet-access`, {
      walletAccess: WalletAccess.ALL,
    });
    expect(staffSelfGrant.status).toBe(403);
  });
});
