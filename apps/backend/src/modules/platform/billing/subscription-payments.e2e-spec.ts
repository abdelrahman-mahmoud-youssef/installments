import { Test } from '@nestjs/testing';
import { SubscriptionPaymentMethod, SubscriptionSource } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../../common/date/utc-date';
import { PrismaService } from '../../../prisma/prisma.service';
import { prepareTestDatabase } from '../../../test-support/test-database';
import { PlatformTenantQueryDto } from '../dto/platform-tenant-query.dto';
import { PlatformTenantFilter } from '../platform-tenant-where';
import { PlatformTenantsService } from '../platform-tenants.service';
import { PlatformPaymentQueryDto } from './dto/platform-payment-query.dto';
import { SubscriptionActivationService } from './subscription-activation.service';
import { SubscriptionPaymentsService } from './subscription-payments.service';

describe('Platform payments and shop tracking', () => {
  let prisma: PrismaService;
  let payments: SubscriptionPaymentsService;
  let tenants: PlatformTenantsService;
  let activation: SubscriptionActivationService;
  let adminId: string;
  const today = getUtcToday();

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, SubscriptionActivationService, SubscriptionPaymentsService, PlatformTenantsService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    payments = moduleRef.get(SubscriptionPaymentsService);
    tenants = moduleRef.get(PlatformTenantsService);
    activation = moduleRef.get(SubscriptionActivationService);
    const admin = await prisma.platformAdmin.create({
      data: { name: 'Owner', email: `owner-${randomUUID()}@example.com`, passwordHash: 'x' },
    });
    adminId = admin.id;
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShop(name: string, subscriptionExpiresOn: Date): Promise<string> {
    const tenant = await prisma.tenant.create({
      data: { name, slug: `shop-${randomUUID()}`, subscriptionExpiresOn },
    });
    return tenant.id;
  }

  function paymentQuery(fields: Partial<PlatformPaymentQueryDto>): PlatformPaymentQueryDto {
    return Object.assign(new PlatformPaymentQueryDto(), { page: 1, limit: 20 }, fields);
  }

  function tenantQuery(fields: Partial<PlatformTenantQueryDto>): PlatformTenantQueryDto {
    return Object.assign(new PlatformTenantQueryDto(), { page: 1, limit: 20 }, fields);
  }

  it('lists payments newest paid first with the shop and totals, and filters them', async () => {
    const shopName = `Payments ${randomUUID()}`;
    const tenantId = await createShop(shopName, today);
    await activation.activate(
      tenantId,
      { source: 'PLAN', planId: 'plan_monthly' },
      { amount: 15_000, paidAt: addUtcDays(today, -10), paymentMethod: SubscriptionPaymentMethod.INSTAPAY },
      adminId,
    );
    await activation.activate(
      tenantId,
      { source: 'MANUAL', months: 1, amount: 0 },
      { paidAt: today, paymentMethod: SubscriptionPaymentMethod.FREE },
      adminId,
    );

    const all = await payments.findAll(paymentQuery({ q: shopName }));
    expect(all.data.map((payment) => [payment.source, payment.amount])).toEqual([
      [SubscriptionSource.MANUAL, 0],
      [SubscriptionSource.PLAN, 15_000],
    ]);
    expect(all.data[1]).toMatchObject({
      tenant: { id: tenantId, name: shopName },
      plan: { nameEn: 'Monthly', nameAr: 'شهري' },
      listPrice: 20_000,
    });
    expect(all.totals).toEqual({ amount: 15_000, discount: 5_000 });

    const yesterday = addUtcDays(today, -1).toISOString().slice(0, 10);
    const recent = await payments.findAll(paymentQuery({ q: shopName, from: yesterday }));
    expect(recent.data.map((payment) => payment.source)).toEqual([SubscriptionSource.MANUAL]);

    const viaPlan = await payments.findAll(paymentQuery({ q: shopName, planId: 'plan_monthly' }));
    expect(viaPlan.total).toBe(1);

    const free = await payments.findAll(paymentQuery({ q: shopName, paymentMethod: SubscriptionPaymentMethod.FREE }));
    expect(free.totals).toEqual({ amount: 0, discount: 0 });
  });

  it('finds shops expiring within a week and shops that never paid, with their last payment', async () => {
    const prefix = `Tracking ${randomUUID()}`;
    const expiringTrial = await createShop(`${prefix} expiring trial`, addUtcDays(today, 3));
    const later = await createShop(`${prefix} later`, addUtcDays(today, 20));
    const expiredUnpaid = await createShop(`${prefix} expired unpaid`, addUtcDays(today, -4));
    const paid = await createShop(`${prefix} paid`, today);
    await activation.activate(
      paid,
      { source: 'PLAN', planId: 'plan_yearly' },
      { paidAt: today, paymentMethod: SubscriptionPaymentMethod.INSTAPAY },
      adminId,
    );

    const expiringSoon = await tenants.findAll(tenantQuery({ q: prefix, status: PlatformTenantFilter.EXPIRING_SOON }));
    expect(expiringSoon.data.map((shop) => shop.id)).toEqual([expiringTrial]);

    const neverPaid = await tenants.findAll(tenantQuery({ q: prefix, status: PlatformTenantFilter.NEVER_PAID }));
    expect(neverPaid.data.map((shop) => shop.id).sort()).toEqual([expiringTrial, expiredUnpaid, later].sort());

    const paidShop = (await tenants.findAll(tenantQuery({ q: `${prefix} paid` }))).data[0];
    expect(paidShop.lastPayment).toMatchObject({
      months: 12,
      amount: 200_000,
      source: SubscriptionSource.PLAN,
      plan: { nameEn: 'Yearly' },
    });
    expect(neverPaid.data.every((shop) => shop.lastPayment === null)).toBe(true);
  });
});
