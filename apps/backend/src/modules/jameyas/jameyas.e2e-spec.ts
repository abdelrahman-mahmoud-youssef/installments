import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JameyaDueStatus, JameyaStatus, RecurrenceType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { DashboardService } from '../dashboard/dashboard.service';
import { ReportsService } from '../reports/reports.service';
import { JameyaPaymentsService } from './jameya-payments.service';
import { JameyaPayoutsService } from './jameya-payouts.service';
import { JameyasService } from './jameyas.service';

describe('Jameyas', () => {
  let prisma: PrismaService;
  let jameyas: JameyasService;
  let payments: JameyaPaymentsService;
  let payouts: JameyaPayoutsService;
  let reports: ReportsService;
  let dashboard: DashboardService;
  const today = getUtcToday();
  const storage = { saveKeyedImage: jest.fn(async (key: string) => `/uploads/${key}`) };

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        JameyasService,
        JameyaPaymentsService,
        { provide: StorageService, useValue: storage },
        JameyaPayoutsService,
        ReportsService,
        DashboardService,
      ],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    jameyas = moduleRef.get(JameyasService);
    payments = moduleRef.get(JameyaPaymentsService);
    payouts = moduleRef.get(JameyaPayoutsService);
    reports = moduleRef.get(ReportsService);
    dashboard = moduleRef.get(DashboardService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  interface Shop {
    tenantId: string;
    customerIds: string[];
  }

  async function createShop(memberCount: number): Promise<Shop> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Shop ${suffix}`,
        slug: `shop-${suffix}`,
        subscriptionExpiresOn: addUtcDays(today, 30),
        jameyaEnabled: true,
      },
    });
    const customers = await prisma.customer.createManyAndReturn({
      data: Array.from({ length: memberCount }, (_, index) => ({
        tenantId: tenant.id,
        name: `Member ${index + 1}`,
        phone: `0100000000${index}`,
      })),
      select: { id: true },
    });
    return { tenantId: tenant.id, customerIds: customers.map((customer) => customer.id) };
  }

  function createJameya(shop: Shop, shareAmount: number, firstDueDate: Date) {
    return jameyas.create(shop.tenantId, {
      name: 'Family circle',
      shareAmount,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: firstDueDate.toISOString().slice(0, 10),
      graceDays: 0,
      customerIds: shop.customerIds,
    });
  }

  function pay(shop: Shop, jameyaId: string, customerId: string, amount: number, clientRequestId = randomUUID()) {
    return payments.create(shop.tenantId, jameyaId, { customerId, amount, clientRequestId });
  }

  function payOut(shop: Shop, jameyaId: string, cycleId: string, customerId: string, amount: number) {
    return payouts.create(shop.tenantId, jameyaId, cycleId, { customerId, amount, clientRequestId: randomUUID() });
  }

  it('refuses a member from another shop and creates nothing', async () => {
    const shop = await createShop(2);
    const otherShop = await createShop(1);

    const mixedMembers = { tenantId: shop.tenantId, customerIds: [shop.customerIds[0], otherShop.customerIds[0]] };

    await expect(createJameya(mixedMembers, 100_000, today)).rejects.toThrow(NotFoundException);
    expect(await prisma.jameya.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  it('applies partial and advance payments to the oldest dues first', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -40));
    const [member] = shop.customerIds;

    await pay(shop, jameya.id, member, 50_000);
    await pay(shop, jameya.id, member, 200_000);

    const detail = await jameyas.findOne(shop.tenantId, jameya.id);
    const memberDues = detail.cycles.map((cycle) =>
      detail.dues.find((due) => due.cycleId === cycle.id && due.customerId === member),
    );
    expect(memberDues.map((due) => [due?.paidAmount, due?.status])).toEqual([
      [100_000, JameyaDueStatus.PAID],
      [100_000, JameyaDueStatus.PAID],
      [50_000, JameyaDueStatus.PARTIALLY_PAID],
    ]);
    expect(detail.members.find((summary) => summary.customerId === member)).toMatchObject({
      dueAmount: 300_000,
      paidAmount: 250_000,
      remainingAmount: 50_000,
    });
  });

  it('refuses a payment above what the member still owes', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, 100_000, today);

    await expect(pay(shop, jameya.id, shop.customerIds[0], 300_001)).rejects.toThrow(
      'The payment is more than what this member still owes.',
    );
    expect(await prisma.jameyaPayment.count({ where: { jameyaId: jameya.id } })).toBe(0);
  });

  it('returns the original payment for a repeated request, including concurrent repeats', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, 100_000, today);
    const [member, concurrentMember] = shop.customerIds;
    const clientRequestId = randomUUID();

    const first = await pay(shop, jameya.id, member, 100_000, clientRequestId);
    const repeated = await pay(shop, jameya.id, member, 100_000, clientRequestId);
    const concurrentRequestId = randomUUID();
    const concurrent = await Promise.all([
      pay(shop, jameya.id, concurrentMember, 300_000, concurrentRequestId),
      pay(shop, jameya.id, concurrentMember, 300_000, concurrentRequestId),
    ]);

    expect(repeated.id).toBe(first.id);
    expect(concurrent[0].id).toBe(concurrent[1].id);
    expect(await prisma.jameyaPayment.count({ where: { jameyaId: jameya.id } })).toBe(2);
    const paid = await prisma.jameyaDue.aggregate({ where: { jameyaId: jameya.id }, _sum: { paidAmount: true } });
    expect(paid._sum.paidAmount).toBe(400_000);
  });

  it('records a payout in parts with the amount the shop covered each time', async () => {
    const shop = await createShop(4);
    const jameya = await createJameya(shop, 250_000, addUtcDays(today, -1));
    const [cycle] = jameya.cycles;
    const [holder, second, third, fourth] = shop.customerIds;
    for (const member of [holder, second, third]) {
      await pay(shop, jameya.id, member, 250_000);
    }

    const firstPart = await payOut(shop, jameya.id, cycle.id, holder, 800_000);
    const afterFirstPart = await jameyas.findOne(shop.tenantId, jameya.id);
    await pay(shop, jameya.id, fourth, 250_000);
    const secondPart = await payOut(shop, jameya.id, cycle.id, holder, 200_000);
    const afterSecondPart = await jameyas.findOne(shop.tenantId, jameya.id);

    expect(firstPart).toMatchObject({
      amount: 800_000,
      collectedAmount: 750_000,
      coveredAmount: 50_000,
      remainingAmount: 200_000,
    });
    expect(afterFirstPart.cycles[0]).toMatchObject({ state: 'PARTIALLY_PAID_OUT', exposureAmount: 50_000 });
    expect(secondPart).toMatchObject({
      amount: 200_000,
      collectedAmount: 1_000_000,
      coveredAmount: 0,
      remainingAmount: 0,
    });
    expect(afterSecondPart.cycles[0]).toMatchObject({ state: 'SETTLED', paidOutAmount: 1_000_000, exposureAmount: 0 });
    expect(afterSecondPart.cycles[0].holders).toEqual([
      {
        customerId: holder,
        contribution: 250_000,
        entitlementAmount: 1_000_000,
        paidOutAmount: 1_000_000,
        remainingAmount: 0,
      },
    ]);
  });

  it('refuses a payout above the remaining entitlement and one for a turn that is not due', async () => {
    const shop = await createShop(2);
    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -1));
    const [firstCycle, secondCycle] = jameya.cycles;
    const [firstHolder, secondHolder] = shop.customerIds;

    await payOut(shop, jameya.id, firstCycle.id, firstHolder, 150_000);
    await expect(payOut(shop, jameya.id, firstCycle.id, firstHolder, 50_001)).rejects.toThrow(
      'The payout is more than what is left for this holder in this turn.',
    );
    await expect(payOut(shop, jameya.id, secondCycle.id, secondHolder, 1)).rejects.toThrow('This turn is not due yet.');
    await expect(payOut(shop, jameya.id, firstCycle.id, secondHolder, 1)).rejects.toThrow(
      'This customer does not hold this turn.',
    );
  });

  it('accepts only one of two concurrent payouts that together exceed the entitlement', async () => {
    const shop = await createShop(2);
    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -1));
    const [cycle] = jameya.cycles;
    const [holder] = shop.customerIds;

    const results = await Promise.allSettled([
      payOut(shop, jameya.id, cycle.id, holder, 120_000),
      payOut(shop, jameya.id, cycle.id, holder, 120_000),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(BadRequestException);
    const paidOut = await prisma.jameyaPayout.aggregate({ where: { cycleId: cycle.id }, _sum: { amount: true } });
    expect(paidOut._sum.amount).toBe(120_000);
  });

  it('completes the jameya after the last due is paid and the last turn is paid out', async () => {
    const shop = await createShop(2);
    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -40));
    const [firstCycle, secondCycle] = jameya.cycles;
    const [firstHolder, secondHolder] = shop.customerIds;

    await payOut(shop, jameya.id, firstCycle.id, firstHolder, 200_000);
    await payOut(shop, jameya.id, secondCycle.id, secondHolder, 200_000);
    await pay(shop, jameya.id, firstHolder, 200_000);
    expect((await jameyas.findOne(shop.tenantId, jameya.id)).status).toBe(JameyaStatus.ACTIVE);

    await pay(shop, jameya.id, secondHolder, 200_000);

    const detail = await jameyas.findOne(shop.tenantId, jameya.id);
    expect(detail.status).toBe(JameyaStatus.COMPLETED);
    expect(detail.cycles.map((cycle) => cycle.state)).toEqual(['SETTLED', 'SETTLED']);
    await expect(pay(shop, jameya.id, firstHolder, 1)).rejects.toThrow('This jameya is no longer active.');
  });

  it('marks dues late only once the grace days have fully passed', async () => {
    const shop = await createShop(2);
    const createWithGrace = (daysAgo: number) =>
      jameyas.create(shop.tenantId, {
        name: 'Grace',
        shareAmount: 100_000,
        recurrenceType: RecurrenceType.MONTHLY,
        firstDueDate: addUtcDays(today, -daysAgo).toISOString().slice(0, 10),
        graceDays: 3,
        customerIds: shop.customerIds,
      });

    const lastGraceDay = await createWithGrace(3);
    const pastGrace = await createWithGrace(4);

    expect(lastGraceDay.cycles[0]).toMatchObject({ lateAfter: today, state: 'DUE' });
    expect(lastGraceDay.dues.filter((due) => due.isLate)).toHaveLength(0);
    expect(pastGrace.cycles[0].state).toBe('LATE');
    expect(pastGrace.members.map((member) => member.lateDueCount)).toEqual([1, 1]);
    const list = await jameyas.findAll(shop.tenantId, { page: 1, limit: 20 });
    expect(list.data.map((item) => [item.id, item.lateDueCount])).toEqual([
      [pastGrace.id, 2],
      [lastGraceDay.id, 0],
    ]);
  });

  it('keeps jameya money out of shop collections, reports and the dashboard', async () => {
    const shop = await createShop(2);
    const reportsBefore = await reports.getReports(shop.tenantId, {});
    const dashboardBefore = await dashboard.getDashboard(shop.tenantId);

    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -1));
    await pay(shop, jameya.id, shop.customerIds[0], 150_000);
    await payOut(shop, jameya.id, jameya.cycles[0].id, shop.customerIds[0], 200_000);

    expect(await reports.getReports(shop.tenantId, {})).toEqual(reportsBefore);
    expect(await dashboard.getDashboard(shop.tenantId)).toEqual(dashboardBefore);
    expect(await prisma.payment.count({ where: { tenantId: shop.tenantId } })).toBe(0);
    expect(await prisma.paymentMethodTransaction.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  describe('a member who holds two turns', () => {
    function createWithTurns(shop: Shop, customerIds: string[], firstDueDate: Date) {
      return jameyas.create(shop.tenantId, {
        name: 'Two turns',
        shareAmount: 100_000,
        recurrenceType: RecurrenceType.MONTHLY,
        firstDueDate: firstDueDate.toISOString().slice(0, 10),
        graceDays: 0,
        customerIds,
      });
    }

    it('refuses a jameya with only one distinct member and creates nothing', async () => {
      const shop = await createShop(1);
      const [only] = shop.customerIds;

      await expect(createWithTurns(shop, [only, only], today)).rejects.toThrow(
        'A jameya needs at least two different members.',
      );
      await expect(
        jameyas.preview(shop.tenantId, {
          name: 'Two turns',
          shareAmount: 100_000,
          recurrenceType: RecurrenceType.MONTHLY,
          firstDueDate: today.toISOString().slice(0, 10),
          graceDays: 0,
          customerIds: [only, only],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(await prisma.jameya.count({ where: { tenantId: shop.tenantId } })).toBe(0);
    });

    it('charges two shares per cycle, pays oldest dues first, pays out each turn separately and completes', async () => {
      const shop = await createShop(2);
      const [twice, once] = shop.customerIds;
      const jameya = await createWithTurns(shop, [twice, once, twice], addUtcDays(today, -70));

      expect(jameya.shareCount).toBe(3);
      expect(jameya.potAmount).toBe(300_000);
      const twiceMember = jameya.members.find((member) => member.customerId === twice)!;
      expect(twiceMember.turnSequences).toEqual([1, 3]);
      expect(twiceMember.dueAmount).toBe(600_000);
      expect(jameya.members).toHaveLength(2);
      const twiceDues = jameya.dues.filter((due) => due.customerId === twice);
      expect(twiceDues.map((due) => due.amount)).toEqual([200_000, 200_000, 200_000]);

      await pay(shop, jameya.id, twice, 300_000);
      let detail = await jameyas.findOne(shop.tenantId, jameya.id);
      const paidByCycle = detail.cycles.map(
        (cycle) => detail.dues.find((due) => due.cycleId === cycle.id && due.customerId === twice)!.paidAmount,
      );
      expect(paidByCycle).toEqual([200_000, 100_000, 0]);

      const [firstCycle, secondCycle, thirdCycle] = detail.cycles;
      const firstPart = await payOut(shop, jameya.id, firstCycle.id, twice, 250_000);
      expect(firstPart).toMatchObject({ remainingAmount: 50_000, coveredAmount: 50_000 });
      const thirdPayout = await payOut(shop, jameya.id, thirdCycle.id, twice, 300_000);
      expect(thirdPayout).toMatchObject({ remainingAmount: 0, coveredAmount: 300_000 });
      await expect(payOut(shop, jameya.id, secondCycle.id, twice, 1)).rejects.toThrow(
        'This customer does not hold this turn.',
      );

      const { data } = await jameyas.findAll(shop.tenantId, { customerId: twice, page: 1, limit: 10 });
      expect(data.find((item) => item.id === jameya.id)?.member).toMatchObject({
        turnSequences: [1, 3],
        remainingAmount: 300_000,
        receivedAmount: 550_000,
      });

      await payOut(shop, jameya.id, firstCycle.id, twice, 50_000);
      await payOut(shop, jameya.id, secondCycle.id, once, 300_000);
      await pay(shop, jameya.id, twice, 300_000);
      expect((await jameyas.findOne(shop.tenantId, jameya.id)).status).toBe(JameyaStatus.ACTIVE);
      await pay(shop, jameya.id, once, 300_000);

      detail = await jameyas.findOne(shop.tenantId, jameya.id);
      expect(detail.status).toBe(JameyaStatus.COMPLETED);
      expect(detail.cycles.map((cycle) => cycle.state)).toEqual(['SETTLED', 'SETTLED', 'SETTLED']);
      expect(detail.members.find((member) => member.customerId === twice)!.receivedAmount).toBe(600_000);
    });
  });

  it('reports what each member owes for turns due by today, apart from later turns', async () => {
    const shop = await createShop(3);
    const jameya = await createJameya(shop, 100_000, addUtcDays(today, -35));
    const [paidAhead, partial, unpaid] = shop.customerIds;

    await pay(shop, jameya.id, paidAhead, 300_000);
    await pay(shop, jameya.id, partial, 150_000);

    const detail = await jameyas.findOne(shop.tenantId, jameya.id);
    const dueNowOf = (customerId: string) =>
      detail.members.find((member) => member.customerId === customerId)!.dueNowAmount;
    expect(detail.cycles.map((cycle) => cycle.dueDate <= today)).toEqual([true, true, false]);
    expect(dueNowOf(paidAhead)).toBe(0);
    expect(dueNowOf(partial)).toBe(50_000);
    expect(dueNowOf(unpaid)).toBe(200_000);
    expect(detail.members.find((member) => member.customerId === unpaid)!.remainingAmount).toBe(300_000);
  });

  it('stores a receipt image with a payment once, even when the request is repeated', async () => {
    const shop = await createShop(2);
    const jameya = await createJameya(shop, 100_000, today);
    const clientRequestId = randomUUID();
    const image = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]).toString('base64');
    storage.saveKeyedImage.mockClear();

    const payment = await payments.create(shop.tenantId, jameya.id, {
      customerId: shop.customerIds[0],
      amount: 50_000,
      image,
      note: 'Sent on InstaPay',
      clientRequestId,
    });
    const repeated = await payments.create(shop.tenantId, jameya.id, {
      customerId: shop.customerIds[0],
      amount: 50_000,
      image,
      clientRequestId,
    });

    expect(payment.receiptUrl).toMatch(new RegExp(`^/uploads/jameya-payments/${shop.tenantId}/.+\\.jpg$`));
    expect(repeated.id).toBe(payment.id);
    expect(storage.saveKeyedImage).toHaveBeenCalledTimes(1);
  });
});
