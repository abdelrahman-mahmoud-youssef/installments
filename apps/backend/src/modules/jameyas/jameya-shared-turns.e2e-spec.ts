import { JameyaDueStatus, JameyaStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { JameyaHttpApp, JameyaTestShop, startJameyaHttpApp } from '../../test-support/jameya-http-app';

interface TurnHolderBody {
  customerId: string;
  contribution?: number;
}

interface HolderView {
  customerId: string;
  contribution: number;
  entitlementAmount: number;
  paidOutAmount: number;
  remainingAmount: number;
}

interface DetailView {
  id: string;
  status: JameyaStatus;
  potAmount: number;
  cycles: { id: string; sequence: number; state: string; holders: HolderView[] }[];
  members: {
    customerId: string;
    monthlyAmount: number;
    turnSequences: number[];
    holdings: { sequence: number; contribution: number; entitlementAmount: number; receivedAmount: number }[];
  }[];
  dues: { cycleId: string; customerId: string; amount: number; paidAmount: number; status: JameyaDueStatus }[];
}

function pounds(amount: number): number {
  return amount * 100;
}

describe('Jameya shared turns', () => {
  let harness: JameyaHttpApp;
  const today = getUtcToday();

  beforeAll(async () => {
    harness = await startJameyaHttpApp();
  }, 120_000);

  afterAll(async () => {
    await harness.app.close();
  });

  function holders(...entries: (string | [string, number])[]): { holders: TurnHolderBody[] } {
    return {
      holders: entries.map((entry) =>
        typeof entry === 'string' ? { customerId: entry } : { customerId: entry[0], contribution: entry[1] },
      ),
    };
  }

  function body(turns: unknown, overrides: Record<string, unknown> = {}) {
    return {
      name: 'Shared circle',
      shareAmount: pounds(1_000),
      recurrenceType: 'MONTHLY',
      firstDueDate: addUtcDays(today, -70).toISOString().slice(0, 10),
      graceDays: 0,
      turns,
      ...overrides,
    };
  }

  function mixedTurns(shop: JameyaTestShop) {
    const [m0, m1, m2, m3, m4, m5, m6, m7] = shop.customerIds;
    return [
      holders(m0),
      holders(m1, m2, m3, m4),
      holders([m5, pounds(600)], [m6, pounds(400)]),
      holders(m0, m5, m7),
    ];
  }

  async function createDetail(shop: JameyaTestShop, turns: unknown, overrides: Record<string, unknown> = {}) {
    const response = await harness.request(shop.adminToken, 'POST', '/jameyas', body(turns, overrides));
    expect(response.status).toBe(201);
    return (await response.json()) as DetailView;
  }

  async function getDetail(shop: JameyaTestShop, jameyaId: string) {
    return (await (await harness.request(shop.adminToken, 'GET', `/jameyas/${jameyaId}`)).json()) as DetailView;
  }

  function pay(shop: JameyaTestShop, jameyaId: string, customerId: string, amount: number) {
    return harness.request(shop.staffToken, 'POST', `/jameyas/${jameyaId}/payments`, {
      customerId,
      amount,
      clientRequestId: randomUUID(),
    });
  }

  function payOut(shop: JameyaTestShop, jameyaId: string, cycleId: string, customerId: string, amount: number) {
    return harness.request(shop.adminToken, 'POST', `/jameyas/${jameyaId}/cycles/${cycleId}/payouts`, {
      customerId,
      amount,
      clientRequestId: randomUUID(),
    });
  }

  it('previews equal and custom splits with each part and what it receives, without writing anything', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 8 });
    const [m0, m1, m2, m3, m4, m5, m6, m7] = shop.customerIds;

    const response = await harness.request(shop.staffToken, 'POST', '/jameyas/preview', body(mixedTurns(shop)));

    expect(response.status).toBe(200);
    const preview = (await response.json()) as {
      potAmount: number;
      cycles: { holders: { customerId: string; contribution: number; entitlementAmount: number }[] }[];
      dueAmounts: { customerId: string; amount: number }[];
    };
    expect(preview.potAmount).toBe(pounds(4_000));
    expect(preview.cycles.map((cycle) => cycle.holders)).toEqual([
      [{ customerId: m0, contribution: pounds(1_000), entitlementAmount: pounds(4_000) }],
      [m1, m2, m3, m4].map((customerId) => ({
        customerId,
        contribution: pounds(250),
        entitlementAmount: pounds(1_000),
      })),
      [
        { customerId: m5, contribution: pounds(600), entitlementAmount: pounds(2_400) },
        { customerId: m6, contribution: pounds(400), entitlementAmount: pounds(1_600) },
      ],
      [
        { customerId: m0, contribution: pounds(334), entitlementAmount: pounds(1_336) },
        { customerId: m5, contribution: pounds(333), entitlementAmount: pounds(1_332) },
        { customerId: m7, contribution: pounds(333), entitlementAmount: pounds(1_332) },
      ],
    ]);
    for (const cycle of preview.cycles) {
      expect(cycle.holders.reduce((total, holder) => total + holder.entitlementAmount, 0)).toBe(preview.potAmount);
    }
    expect(Object.fromEntries(preview.dueAmounts.map((due) => [due.customerId, due.amount]))).toEqual({
      [m0]: pounds(1_334),
      [m1]: pounds(250),
      [m2]: pounds(250),
      [m3]: pounds(250),
      [m4]: pounds(250),
      [m5]: pounds(933),
      [m6]: pounds(400),
      [m7]: pounds(333),
    });
    expect(await harness.prisma.jameya.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  it('creates shared turns and returns each holder, each member holding and their monthly amount', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 8 });
    const [m0, , , , , m5] = shop.customerIds;

    const jameya = await createDetail(shop, mixedTurns(shop));

    expect(jameya.cycles[3].holders).toEqual([
      expect.objectContaining({
        customerId: m0,
        contribution: pounds(334),
        paidOutAmount: 0,
        remainingAmount: pounds(1_336),
      }),
      expect.objectContaining({ customerId: m5, contribution: pounds(333), remainingAmount: pounds(1_332) }),
      expect.objectContaining({ contribution: pounds(333), remainingAmount: pounds(1_332) }),
    ]);
    const firstMember = jameya.members.find((member) => member.customerId === m0);
    expect(firstMember).toMatchObject({ monthlyAmount: pounds(1_334), turnSequences: [1, 4] });
    expect(firstMember?.holdings).toEqual([
      {
        cycleId: jameya.cycles[0].id,
        sequence: 1,
        contribution: pounds(1_000),
        entitlementAmount: pounds(4_000),
        receivedAmount: 0,
      },
      {
        cycleId: jameya.cycles[3].id,
        sequence: 4,
        contribution: pounds(334),
        entitlementAmount: pounds(1_336),
        receivedAmount: 0,
      },
    ]);
    expect(jameya.dues.filter((due) => due.customerId === m5).map((due) => due.amount)).toEqual(
      Array.from({ length: 4 }, () => pounds(933)),
    );

    const list = (await (
      await harness.request(shop.staffToken, 'GET', `/jameyas?customerId=${m5}`)
    ).json()) as { data: { member: { turnSequences: number[]; monthlyAmount: number } }[] };
    expect(list.data[0].member).toMatchObject({ turnSequences: [3, 4], monthlyAmount: pounds(933) });
  });

  it('keeps accepting customerIds as one full holder per turn', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 2 });

    const jameya = await createDetail(shop, undefined, { customerIds: shop.customerIds });

    expect(jameya.cycles.map((cycle) => cycle.holders.map((holder) => holder.contribution))).toEqual([
      [pounds(1_000)],
      [pounds(1_000)],
    ]);
  });

  it('answers 400 to every invalid split or amount and creates nothing', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 6 });
    const [m0, m1, m2, m3, m4, m5] = shop.customerIds;
    const invalidBodies = [
      body([holders([m0, pounds(600)], [m1, pounds(300)]), holders(m2)]),
      body([holders(m0, m1, m2, m3, m4), holders(m5)]),
      body([holders(m0, m0), holders(m1)]),
      body([holders([m0, pounds(600)], m1), holders(m2)]),
      body([holders(m0), holders(m1)], { shareAmount: 100_050 }),
      body([holders([m0, 60_050], [m1, 39_950]), holders(m2)]),
      body([holders(m0), holders(m0)]),
      body([holders(m0), holders(m1)], { customerIds: [m0, m1] }),
      body([holders(m0)]),
    ];

    const statuses = await Promise.all(
      invalidBodies.map(
        async (invalidBody) => (await harness.request(shop.adminToken, 'POST', '/jameyas', invalidBody)).status,
      ),
    );

    expect(statuses).toEqual(invalidBodies.map(() => 400));
    expect(await harness.prisma.jameya.count({ where: { tenantId: shop.tenantId } })).toBe(0);
  });

  it('answers 400 to a payment or payout that is not whole pounds', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 2 });
    const [m0, m1] = shop.customerIds;
    const jameya = await createDetail(shop, [holders(m0), holders(m1)]);

    const payment = await pay(shop, jameya.id, m0, 10_050);
    const payout = await payOut(shop, jameya.id, jameya.cycles[0].id, m0, 10_050);

    expect([payment.status, payout.status]).toEqual([400, 400]);
    expect(await harness.prisma.jameyaPayment.count({ where: { jameyaId: jameya.id } })).toBe(0);
    expect(await harness.prisma.jameyaPayout.count({ where: { jameyaId: jameya.id } })).toBe(0);
  });

  it("allocates a partner's payment oldest first against their own monthly amount", async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 8 });
    const m5 = shop.customerIds[5];
    const jameya = await createDetail(shop, mixedTurns(shop));

    expect((await pay(shop, jameya.id, m5, pounds(1_500))).status).toBe(201);

    const detail = await getDetail(shop, jameya.id);
    const partnerDues = detail.cycles.map((cycle) =>
      detail.dues.find((due) => due.cycleId === cycle.id && due.customerId === m5),
    );
    expect(partnerDues.map((due) => [due?.paidAmount, due?.status])).toEqual([
      [pounds(933), JameyaDueStatus.PAID],
      [pounds(567), JameyaDueStatus.PARTIALLY_PAID],
      [0, JameyaDueStatus.PENDING],
      [0, JameyaDueStatus.PENDING],
    ]);
  });

  it('pays each partner of a shared turn their own part, in parts, with what the shop covered', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 8 });
    const [, m1, , , , m5, m6] = shop.customerIds;
    const jameya = await createDetail(shop, mixedTurns(shop));
    const sharedTurn = jameya.cycles[2];
    expect((await pay(shop, jameya.id, m1, pounds(750))).status).toBe(201);

    const first = await payOut(shop, jameya.id, sharedTurn.id, m5, pounds(1_000));
    const second = await payOut(shop, jameya.id, sharedTurn.id, m6, pounds(1_600));
    const overPaid = await payOut(shop, jameya.id, sharedTurn.id, m6, pounds(1));
    const tooMuch = await payOut(shop, jameya.id, sharedTurn.id, m5, pounds(1_401));
    const last = await payOut(shop, jameya.id, sharedTurn.id, m5, pounds(1_400));

    expect(await first.json()).toMatchObject({
      amount: pounds(1_000),
      collectedAmount: pounds(250),
      coveredAmount: pounds(750),
      remainingAmount: pounds(1_400),
    });
    expect(await second.json()).toMatchObject({
      amount: pounds(1_600),
      coveredAmount: pounds(1_600),
      remainingAmount: 0,
    });
    expect([overPaid.status, tooMuch.status]).toEqual([400, 400]);
    expect(await last.json()).toMatchObject({ coveredAmount: pounds(1_400), remainingAmount: 0 });

    const detail = await getDetail(shop, jameya.id);
    expect(detail.cycles[2].state).toBe('PAID_OUT');
    expect(detail.cycles[2].holders.map((holder) => [holder.paidOutAmount, holder.remainingAmount])).toEqual([
      [pounds(2_400), 0],
      [pounds(1_600), 0],
    ]);
    expect(detail.members.find((member) => member.customerId === m6)?.holdings).toEqual([
      expect.objectContaining({ sequence: 3, receivedAmount: pounds(1_600) }),
    ]);
  });

  it('never lets concurrent payouts take a partner past their own part', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 8 });
    const [, m1, m2] = shop.customerIds;
    const jameya = await createDetail(shop, mixedTurns(shop));
    const sharedTurn = jameya.cycles[1];

    const responses = await Promise.all([
      payOut(shop, jameya.id, sharedTurn.id, m1, pounds(1_000)),
      payOut(shop, jameya.id, sharedTurn.id, m1, pounds(1_000)),
      payOut(shop, jameya.id, sharedTurn.id, m2, pounds(1_000)),
      payOut(shop, jameya.id, sharedTurn.id, m2, pounds(600)),
    ]);

    const statuses = responses.map((response) => response.status);
    expect(statuses.slice(0, 2).sort()).toEqual([201, 400]);
    expect(statuses.slice(2).sort()).toEqual([201, 400]);
    const detail = await getDetail(shop, jameya.id);
    const [first, second] = detail.cycles[1].holders;
    expect(first.paidOutAmount).toBe(pounds(1_000));
    expect([pounds(1_000), pounds(600)]).toContain(second.paidOutAmount);
    for (const holder of detail.cycles[1].holders) {
      expect(holder.paidOutAmount).toBeLessThanOrEqual(holder.entitlementAmount);
    }
  });

  it('completes the jameya only after every partner is fully paid out', async () => {
    const shop = await harness.createShop({ jameyaEnabled: true, memberCount: 3 });
    const [a, b, c] = shop.customerIds;
    const jameya = await createDetail(shop, [holders(a, b), holders(c)], {
      firstDueDate: addUtcDays(today, -40).toISOString().slice(0, 10),
    });
    for (const [customerId, amount] of [
      [a, pounds(1_000)],
      [b, pounds(1_000)],
      [c, pounds(2_000)],
    ] as const) {
      expect((await pay(shop, jameya.id, customerId, amount)).status).toBe(201);
    }

    expect((await payOut(shop, jameya.id, jameya.cycles[1].id, c, pounds(2_000))).status).toBe(201);
    expect((await payOut(shop, jameya.id, jameya.cycles[0].id, a, pounds(1_000))).status).toBe(201);
    expect((await getDetail(shop, jameya.id)).status).toBe(JameyaStatus.ACTIVE);

    expect((await payOut(shop, jameya.id, jameya.cycles[0].id, b, pounds(1_000))).status).toBe(201);
    expect((await getDetail(shop, jameya.id)).status).toBe(JameyaStatus.COMPLETED);
  });
});
