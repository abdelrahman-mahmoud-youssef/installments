import { Test } from '@nestjs/testing';
import { NotificationLanguage, RecurrenceType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { JameyaPaymentsService } from './jameya-payments.service';
import { JameyaPayoutsService } from './jameya-payouts.service';
import { computeJameyaSummaryTotals } from './jameya-summary-totals';
import { JameyasService } from './jameyas.service';

describe('Jameya follow-up', () => {
  let prisma: PrismaService;
  let jameyas: JameyasService;
  let payments: JameyaPaymentsService;
  let payouts: JameyaPayoutsService;
  const today = getUtcToday();

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, JameyasService, JameyaPaymentsService,
        { provide: StorageService, useValue: {} }, JameyaPayoutsService],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    jameyas = moduleRef.get(JameyasService);
    payments = moduleRef.get(JameyaPaymentsService);
    payouts = moduleRef.get(JameyaPayoutsService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  interface Shop {
    tenantId: string;
    customerIds: string[];
  }

  async function createShop(memberCount: number, jameyaEnabled = true): Promise<Shop> {
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
      data: Array.from({ length: memberCount }, (_, index) => ({
        tenantId: tenant.id,
        name: `Member ${index + 1}`,
        phone: `0100000000${index}`,
        notificationLanguage: NotificationLanguage.EN,
      })),
      select: { id: true },
    });
    return { tenantId: tenant.id, customerIds: customers.map((customer) => customer.id) };
  }

  function createJameya(shop: Shop, firstDueDate: Date, customerIds = shop.customerIds) {
    return jameyas.create(shop.tenantId, {
      name: 'Circle',
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: firstDueDate.toISOString().slice(0, 10),
      graceDays: 0,
      customerIds,
    });
  }

  function pay(shop: Shop, jameyaId: string, customerId: string, amount: number, clientRequestId = randomUUID()) {
    return payments.create(shop.tenantId, jameyaId, { customerId, amount, clientRequestId });
  }

  it("lists a customer's own turn, balance, late amount and received amount", async () => {
    const shop = await createShop(3);
    const [member, other, third] = shop.customerIds;
    const lateJameya = await createJameya(shop, addUtcDays(today, -40), [other, member, third]);
    const futureJameya = await createJameya(shop, addUtcDays(today, 10), [member, other, third]);
    await pay(shop, lateJameya.id, member, 50_000);
    await pay(shop, lateJameya.id, other, 300_000);
    await payouts.create(shop.tenantId, lateJameya.id, lateJameya.cycles[1].id, {
      customerId: member,
      amount: 120_000,
      clientRequestId: randomUUID(),
    });

    const list = await jameyas.findAll(shop.tenantId, { customerId: member, page: 1, limit: 20 });
    const byId = new Map(list.data.map((item) => [item.id, item.member]));

    expect(byId.get(lateJameya.id)).toEqual({
      turnSequences: [2],
      remainingAmount: 250_000,
      lateAmount: 150_000,
      receivedAmount: 120_000,
    });
    expect(byId.get(futureJameya.id)).toEqual({
      turnSequences: [1],
      remainingAmount: 300_000,
      lateAmount: 0,
      receivedAmount: 0,
    });
    const unfiltered = await jameyas.findAll(shop.tenantId, { page: 1, limit: 20 });
    expect(unfiltered.data.every((item) => item.member === undefined)).toBe(true);
  });

  it('records the balance owed after partial, advance and final payments', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, addUtcDays(today, -40));
    const [member] = shop.customerIds;

    const partial = await pay(shop, jameya.id, member, 40_000);
    const advance = await pay(shop, jameya.id, member, 210_000);
    const final = await pay(shop, jameya.id, member, 50_000);

    expect([partial.balanceAfter, advance.balanceAfter, final.balanceAfter]).toEqual([260_000, 50_000, 0]);
  });

  it('gives concurrent payments consecutive balances and a repeat the original balance', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, today);
    const [member] = shop.customerIds;
    const clientRequestId = randomUUID();

    const concurrent = await Promise.all([
      pay(shop, jameya.id, member, 100_000, clientRequestId),
      pay(shop, jameya.id, member, 100_000),
    ]);
    const repeated = await pay(shop, jameya.id, member, 100_000, clientRequestId);

    expect(concurrent.map((payment) => payment.balanceAfter).sort((a, b) => a - b)).toEqual([100_000, 200_000]);
    const original = concurrent.find((payment) => payment.clientRequestId === clientRequestId);
    expect(repeated).toMatchObject({ id: original?.id, balanceAfter: original?.balanceAfter });
    expect(await prisma.jameyaPayment.count({ where: { jameyaId: jameya.id } })).toBe(2);
  });

  it('returns a reminder only for members who still owe something', async () => {
    const shop = await createShop(2);
    const jameya = await createJameya(shop, addUtcDays(today, -40));
    const [paidUp, owing] = shop.customerIds;
    await pay(shop, jameya.id, paidUp, 200_000);

    const detail = await jameyas.findOne(shop.tenantId, jameya.id);
    const reminders = new Map(detail.members.map((member) => [member.customerId, member.reminderMessage]));

    expect(reminders.get(paidUp)).toBeNull();
    expect(reminders.get(owing)).toContain('is late');
    expect(reminders.get(owing)).toContain(`Shop `);

    const inGrace = await jameyas.create(shop.tenantId, {
      name: 'Grace',
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: addUtcDays(today, -2).toISOString().slice(0, 10),
      graceDays: 5,
      customerIds: shop.customerIds,
    });
    expect(inGrace.members[0].reminderMessage).toContain('has been due since');
    expect(inGrace.members[0].reminderMessage).not.toMatch(/late|next payment/);
  });

  it('counts dues today, late dues and pending payouts only for shops with jameya on', async () => {
    const shop = await createShop(2);
    await createJameya(shop, today);
    const late = await createJameya(shop, addUtcDays(today, -40));
    await pay(shop, late.id, shop.customerIds[0], 100_000);
    await payouts.create(shop.tenantId, late.id, late.cycles[0].id, {
      customerId: shop.customerIds[0],
      amount: 200_000,
      clientRequestId: randomUUID(),
    });
    await payouts.create(shop.tenantId, late.id, late.cycles[1].id, {
      customerId: shop.customerIds[1],
      amount: 50_000,
      clientRequestId: randomUUID(),
    });
    const switchedOff = await createShop(2, false);
    await createJameya(switchedOff, today);

    expect(await computeJameyaSummaryTotals(prisma, { id: shop.tenantId, jameyaEnabled: true }, today)).toEqual({
      dueTodayCount: 2,
      lateCount: 3,
      payoutsPendingCount: 2,
    });
    expect(await computeJameyaSummaryTotals(prisma, { id: switchedOff.tenantId, jameyaEnabled: false }, today)).toBe(
      undefined,
    );
  });
});
