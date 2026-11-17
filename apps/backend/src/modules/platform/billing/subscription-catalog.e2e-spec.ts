import { Test } from '@nestjs/testing';
import { SubscriptionPaymentMethod } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../../common/date/utc-date';
import { SubscriptionOfferStatus } from '../../../common/subscription/subscription';
import { PrismaService } from '../../../prisma/prisma.service';
import { prepareTestDatabase } from '../../../test-support/test-database';
import { SubscriptionActivationService } from './subscription-activation.service';
import { SubscriptionOffersService } from './subscription-offers.service';
import { SubscriptionPlansService } from './subscription-plans.service';

describe('Subscription plans and offers', () => {
  let prisma: PrismaService;
  let plans: SubscriptionPlansService;
  let offers: SubscriptionOffersService;
  let activation: SubscriptionActivationService;
  const today = getUtcToday();

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, SubscriptionPlansService, SubscriptionOffersService, SubscriptionActivationService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    plans = moduleRef.get(SubscriptionPlansService);
    offers = moduleRef.get(SubscriptionOffersService);
    activation = moduleRef.get(SubscriptionActivationService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function isoDay(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  function offerInput(startsOn: Date, endsOn: Date) {
    return {
      nameEn: `Offer ${randomUUID()}`,
      nameAr: 'عرض',
      months: 3,
      price: 40_000,
      regularPrice: 60_000,
      startsOn: isoDay(startsOn),
      endsOn: isoDay(endsOn),
    };
  }

  it('ships with the monthly and yearly plans', async () => {
    const seeded = await prisma.subscriptionPlan.findMany({
      where: { id: { in: ['plan_monthly', 'plan_yearly'] } },
      orderBy: { months: 'asc' },
    });

    expect(seeded.map(({ months, price }) => ({ months, price }))).toEqual([
      { months: 1, price: 20_000 },
      { months: 12, price: 200_000 },
    ]);
  });

  it('adds a plan at the end of the list and edits only the given fields', async () => {
    const countBefore = await prisma.subscriptionPlan.count();

    const plan = await plans.create({ nameEn: 'Quarterly', nameAr: 'ربع سنوي', months: 3, price: 55_000 });
    expect(plan).toMatchObject({ sortOrder: countBefore, isActive: true });

    const updated = await plans.update(plan.id, { price: 50_000, isActive: false });
    expect(updated).toMatchObject({ nameEn: 'Quarterly', months: 3, price: 50_000, isActive: false });
  });

  it('lists offers with their status and how many shops used them', async () => {
    const running = await offers.create(offerInput(addUtcDays(today, -1), addUtcDays(today, 5)));
    const scheduled = await offers.create(offerInput(addUtcDays(today, 3), addUtcDays(today, 9)));
    const tenant = await prisma.tenant.create({
      data: { name: 'Shop', slug: `shop-${randomUUID()}`, subscriptionExpiresOn: today },
    });
    const admin = await prisma.platformAdmin.create({
      data: { name: 'Owner', email: `owner-${randomUUID()}@example.com`, passwordHash: 'x' },
    });
    await activation.activate(
      tenant.id,
      { source: 'OFFER', offerId: running.id },
      { paidAt: today, paymentMethod: SubscriptionPaymentMethod.INSTAPAY },
      admin.id,
    );

    const listed = await offers.findAll();

    expect(listed.find((offer) => offer.id === running.id)).toMatchObject({
      status: SubscriptionOfferStatus.RUNNING,
      timesUsed: 1,
    });
    expect(listed.find((offer) => offer.id === scheduled.id)).toMatchObject({
      status: SubscriptionOfferStatus.SCHEDULED,
      timesUsed: 0,
    });
  });

  it('refuses offer terms that break the rules, including after a partial edit', async () => {
    await expect(offers.create({ ...offerInput(today, today), price: 70_000 })).rejects.toThrow(
      'The offer price must not be higher than the regular price.',
    );

    const offer = await offers.create(offerInput(today, addUtcDays(today, 10)));
    await expect(offers.update(offer.id, { endsOn: isoDay(addUtcDays(today, -1)) })).rejects.toThrow(
      'The offer must end on or after its start date.',
    );

    const unchanged = await prisma.subscriptionOffer.findUniqueOrThrow({ where: { id: offer.id } });
    expect(isoDay(unchanged.endsOn)).toBe(isoDay(addUtcDays(today, 10)));
  });
});
