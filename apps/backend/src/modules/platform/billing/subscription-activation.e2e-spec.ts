import { Test } from '@nestjs/testing';
import { SubscriptionPaymentMethod, SubscriptionSource } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../../common/date/utc-date';
import { PrismaService } from '../../../prisma/prisma.service';
import { prepareTestDatabase } from '../../../test-support/test-database';
import { SubscriptionActivationService } from './subscription-activation.service';

describe('SubscriptionActivationService', () => {
  let prisma: PrismaService;
  let activation: SubscriptionActivationService;
  let adminId: string;
  const today = getUtcToday();
  const instapayToday = { paidAt: today, paymentMethod: SubscriptionPaymentMethod.INSTAPAY };

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, SubscriptionActivationService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    activation = moduleRef.get(SubscriptionActivationService);
    const admin = await prisma.platformAdmin.create({
      data: { name: 'Owner', email: `owner-${randomUUID()}@example.com`, passwordHash: 'x' },
    });
    adminId = admin.id;
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShop(subscriptionExpiresOn: Date): Promise<string> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: { name: `Shop ${suffix}`, slug: `shop-${suffix}`, subscriptionExpiresOn },
    });
    return tenant.id;
  }

  function createPlan(months: number, price: number, isActive = true) {
    return prisma.subscriptionPlan.create({
      data: { nameEn: `${months} months`, nameAr: `${months} شهور`, months, price, isActive },
    });
  }

  function createOffer(startsOn: Date, endsOn: Date) {
    return prisma.subscriptionOffer.create({
      data: {
        nameEn: 'New year',
        nameAr: 'رأس السنة',
        months: 3,
        price: 40_000,
        regularPrice: 60_000,
        startsOn,
        endsOn,
      },
    });
  }

  async function expiryOf(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return tenant.subscriptionExpiresOn.toISOString().slice(0, 10);
  }

  function isoDay(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  it('starts a monthly plan today for an expired shop and records the full payment', async () => {
    const tenantId = await createShop(addUtcDays(today, -5));
    const plan = await createPlan(1, 20_000);

    const record = await activation.activate(
      tenantId,
      { source: 'PLAN', planId: plan.id },
      { ...instapayToday, reference: 'IPN-123', note: 'Paid by owner' },
      adminId,
    );

    expect(record).toMatchObject({
      months: 1,
      source: SubscriptionSource.PLAN,
      planId: plan.id,
      offerId: null,
      listPrice: 20_000,
      amount: 20_000,
      paymentMethod: SubscriptionPaymentMethod.INSTAPAY,
      reference: 'IPN-123',
      note: 'Paid by owner',
      activatedById: adminId,
    });
    expect(isoDay(record.periodStart)).toBe(isoDay(today));
    expect(isoDay(record.paidAt)).toBe(isoDay(today));
    expect(await expiryOf(tenantId)).toBe(isoDay(record.periodEnd));
  });

  it('adds a yearly plan after the current expiry when renewed early', async () => {
    const currentExpiry = addUtcDays(today, 10);
    const tenantId = await createShop(currentExpiry);
    const plan = await createPlan(12, 200_000);

    const record = await activation.activate(tenantId, { source: 'PLAN', planId: plan.id }, instapayToday, adminId);

    expect(isoDay(record.periodStart)).toBe(isoDay(currentExpiry));
    const expectedEnd = new Date(currentExpiry);
    expectedEnd.setUTCFullYear(expectedEnd.getUTCFullYear() + 1);
    expect(isoDay(record.periodEnd)).toBe(isoDay(expectedEnd));
  });

  it('keeps the full price beside a discounted amount', async () => {
    const tenantId = await createShop(today);
    const plan = await createPlan(1, 20_000);

    const record = await activation.activate(
      tenantId,
      { source: 'PLAN', planId: plan.id },
      { ...instapayToday, amount: 15_000 },
      adminId,
    );

    expect(record).toMatchObject({ listPrice: 20_000, amount: 15_000 });
  });

  it('applies an offer paid while it was running, even after it has ended', async () => {
    const tenantId = await createShop(today);
    const offer = await createOffer(addUtcDays(today, -20), addUtcDays(today, -2));

    const record = await activation.activate(
      tenantId,
      { source: 'OFFER', offerId: offer.id },
      { ...instapayToday, paidAt: addUtcDays(today, -3) },
      adminId,
    );

    expect(record).toMatchObject({
      months: 3,
      source: SubscriptionSource.OFFER,
      offerId: offer.id,
      listPrice: 60_000,
      amount: 40_000,
    });
  });

  it('refuses an offer paid outside its dates and a second use by the same shop', async () => {
    const tenantId = await createShop(today);
    const offer = await createOffer(addUtcDays(today, -5), addUtcDays(today, 5));

    await expect(
      activation.activate(
        tenantId,
        { source: 'OFFER', offerId: offer.id },
        { ...instapayToday, paidAt: addUtcDays(today, -6) },
        adminId,
      ),
    ).rejects.toThrow('This offer was not running on the paid date.');

    await activation.activate(tenantId, { source: 'OFFER', offerId: offer.id }, instapayToday, adminId);
    await expect(
      activation.activate(tenantId, { source: 'OFFER', offerId: offer.id }, instapayToday, adminId),
    ).rejects.toThrow('This shop has already used this offer.');
    expect(await prisma.tenantSubscription.count({ where: { tenantId } })).toBe(1);
  });

  it('refuses a switched-off plan and a paid date in the future without changing the shop', async () => {
    const tenantId = await createShop(today);
    const offPlan = await createPlan(1, 20_000, false);
    const plan = await createPlan(1, 20_000);

    await expect(
      activation.activate(tenantId, { source: 'PLAN', planId: offPlan.id }, instapayToday, adminId),
    ).rejects.toThrow('This plan is not available.');
    await expect(
      activation.activate(
        tenantId,
        { source: 'PLAN', planId: plan.id },
        { ...instapayToday, paidAt: addUtcDays(today, 1) },
        adminId,
      ),
    ).rejects.toThrow('The paid date cannot be in the future.');

    expect(await expiryOf(tenantId)).toBe(isoDay(today));
    expect(await prisma.tenantSubscription.count({ where: { tenantId } })).toBe(0);
  });

  it('records free manual months', async () => {
    const tenantId = await createShop(today);

    const record = await activation.activate(
      tenantId,
      { source: 'MANUAL', months: 2, amount: 0 },
      { paidAt: today, paymentMethod: SubscriptionPaymentMethod.FREE, note: 'Compensation' },
      adminId,
    );

    expect(record).toMatchObject({
      months: 2,
      source: SubscriptionSource.MANUAL,
      planId: null,
      listPrice: 0,
      amount: 0,
      paymentMethod: SubscriptionPaymentMethod.FREE,
    });
  });

  it('keeps past payments unchanged when a plan price changes later', async () => {
    const tenantId = await createShop(today);
    const plan = await createPlan(1, 20_000);
    const record = await activation.activate(tenantId, { source: 'PLAN', planId: plan.id }, instapayToday, adminId);

    await prisma.subscriptionPlan.update({ where: { id: plan.id }, data: { price: 25_000 } });

    const stored = await prisma.tenantSubscription.findUniqueOrThrow({ where: { id: record.id } });
    expect(stored).toMatchObject({ listPrice: 20_000, amount: 20_000 });
  });
});
