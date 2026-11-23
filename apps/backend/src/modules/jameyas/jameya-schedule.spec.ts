import { RecurrenceType } from '@prisma/client';
import { calculateEntitlement, calculatePot, splitEqually } from './jameya-amounts';
import { buildJameyaSchedule, RequestedTurn } from './jameya-schedule';

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fullTurns(customerIds: string[]): RequestedTurn[] {
  return customerIds.map((customerId) => ({ holders: [{ customerId }] }));
}

function pounds(amount: number): number {
  return amount * 100;
}

const monthlyBase = {
  recurrenceType: RecurrenceType.MONTHLY,
  firstDueDate: new Date('2027-01-10'),
  graceDays: 0,
};

function twentyTurnJameya() {
  const turns = fullTurns(Array.from({ length: 20 }, (_, index) => `solo-${index + 1}`));
  turns[4] = { holders: ['q1', 'q2', 'q3', 'q4'].map((customerId) => ({ customerId })) };
  turns[5] = {
    holders: [
      { customerId: 'six-big', contribution: pounds(600) },
      { customerId: 'six-small', contribution: pounds(400) },
    ],
  };
  return buildJameyaSchedule({ ...monthlyBase, shareAmount: pounds(1_000), turns });
}

describe('buildJameyaSchedule', () => {
  it('clamps monthly due dates to the end of shorter months and keeps the anchor day', () => {
    const schedule = buildJameyaSchedule({
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2027-01-31'),
      graceDays: 0,
      turns: fullTurns(['a', 'b', 'c', 'd']),
    });

    expect(schedule.cycles.map((cycle) => isoDay(cycle.dueDate))).toEqual([
      '2027-01-31',
      '2027-02-28',
      '2027-03-31',
      '2027-04-30',
    ]);
    expect(schedule.cycles.map((cycle) => cycle.sequence)).toEqual([1, 2, 3, 4]);
  });

  it('spaces weekly due dates seven days apart', () => {
    const schedule = buildJameyaSchedule({
      shareAmount: 50_000,
      recurrenceType: RecurrenceType.WEEKLY,
      firstDueDate: new Date('2026-12-29'),
      graceDays: 0,
      turns: fullTurns(['a', 'b', 'c']),
    });

    expect(schedule.cycles.map((cycle) => isoDay(cycle.dueDate))).toEqual(['2026-12-29', '2027-01-05', '2027-01-12']);
  });

  it('freezes lateAfter as the due date plus the grace days', () => {
    const schedule = buildJameyaSchedule({
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2027-01-31'),
      graceDays: 3,
      turns: fullTurns(['a', 'b']),
    });

    expect(schedule.cycles.map((cycle) => isoDay(cycle.lateAfter))).toEqual(['2027-02-03', '2027-03-03']);
  });

  it('gives each turn its holder and makes every member owe their monthly amount in every cycle', () => {
    const schedule = buildJameyaSchedule({
      ...monthlyBase,
      shareAmount: pounds(1_000),
      turns: fullTurns(['a', 'b', 'c']),
    });

    expect(schedule.cycles.map((cycle) => cycle.holders)).toEqual(
      ['a', 'b', 'c'].map((customerId) => [{ customerId, contribution: pounds(1_000) }]),
    );
    expect(schedule.dues).toHaveLength(9);
    expect(schedule.dues.every((due) => due.amount === pounds(1_000))).toBe(true);
  });

  it('splits a 4-way turn into equal parts that each receive a quarter of the pot', () => {
    const schedule = twentyTurnJameya();
    const shareCount = schedule.cycles.length;

    expect(calculatePot(pounds(1_000), shareCount)).toBe(pounds(20_000));
    expect(schedule.cycles[4].holders).toEqual(
      ['q1', 'q2', 'q3', 'q4'].map((customerId) => ({ customerId, contribution: pounds(250) })),
    );
    expect(schedule.cycles[4].holders.map((holder) => calculateEntitlement(holder.contribution, shareCount))).toEqual([
      pounds(5_000),
      pounds(5_000),
      pounds(5_000),
      pounds(5_000),
    ]);
  });

  it('pays a 600/400 turn 12,000 and 8,000', () => {
    const schedule = twentyTurnJameya();
    const shareCount = schedule.cycles.length;

    expect(schedule.cycles[5].holders.map((holder) => calculateEntitlement(holder.contribution, shareCount))).toEqual([
      pounds(12_000),
      pounds(8_000),
    ]);
    expect(schedule.dueAmounts.find((due) => due.customerId === 'six-big')?.amount).toBe(pounds(600));
    expect(schedule.dueAmounts.find((due) => due.customerId === 'six-small')?.amount).toBe(pounds(400));
  });

  it('keeps the pot equal to the sum of entitlements and of dues in every turn', () => {
    const schedule = twentyTurnJameya();
    const shareCount = schedule.cycles.length;
    const potAmount = calculatePot(pounds(1_000), shareCount);

    for (const cycle of schedule.cycles) {
      const entitlements = cycle.holders.reduce(
        (total, holder) => total + calculateEntitlement(holder.contribution, shareCount),
        0,
      );
      const collectedWhenAllPay = schedule.dues
        .filter((due) => due.sequence === cycle.sequence)
        .reduce((total, due) => total + due.amount, 0);
      expect(entitlements).toBe(potAmount);
      expect(collectedWhenAllPay).toBe(potAmount);
    }
  });

  it('charges a person with a full turn and a quarter of another turn both parts every cycle', () => {
    const schedule = buildJameyaSchedule({
      ...monthlyBase,
      shareAmount: pounds(1_000),
      turns: [
        { holders: [{ customerId: 'mixed' }] },
        { holders: ['mixed', 'b', 'c', 'd'].map((customerId) => ({ customerId })) },
        { holders: [{ customerId: 'e' }] },
      ],
    });

    expect(schedule.dueAmounts.find((due) => due.customerId === 'mixed')?.amount).toBe(pounds(1_250));
    expect(schedule.dues.filter((due) => due.customerId === 'mixed')).toHaveLength(3);
    expect(calculateEntitlement(schedule.cycles[1].holders[0].contribution, 3)).toBe(pounds(750));
  });

  it.each([
    ['adjacent turns', ['repeat', 'repeat', 'b', 'c']],
    ['the first and last turns', ['repeat', 'b', 'c', 'repeat']],
  ])('charges a member who holds %s two shares in every cycle and gives them each of those turns', (_label, order) => {
    const schedule = buildJameyaSchedule({ ...monthlyBase, shareAmount: pounds(1_000), turns: fullTurns(order) });

    expect(schedule.cycles.map((cycle) => cycle.holders[0].customerId)).toEqual(order);
    expect(schedule.dueAmounts).toEqual([
      { customerId: 'repeat', amount: pounds(2_000) },
      { customerId: 'b', amount: pounds(1_000) },
      { customerId: 'c', amount: pounds(1_000) },
    ]);
    expect(schedule.dues).toHaveLength(order.length * 3);
  });

  it.each([
    [
      'a turn that does not add up',
      [
        { customerId: 'a', contribution: pounds(600) },
        { customerId: 'b', contribution: pounds(300) },
      ],
      'add up to exactly the share amount',
    ],
    ['a repeated holder', [{ customerId: 'a' }, { customerId: 'a' }], 'only once in the same turn'],
    [
      'a mixed omitted amount',
      [{ customerId: 'a', contribution: pounds(600) }, { customerId: 'b' }],
      'every holder in a turn has an amount or none does',
    ],
    [
      'a part that is not whole pounds',
      [
        { customerId: 'a', contribution: 60_050 },
        { customerId: 'b', contribution: 39_950 },
      ],
      'positive whole number of pounds',
    ],
    [
      'a zero part',
      [
        { customerId: 'a', contribution: pounds(1_000) },
        { customerId: 'b', contribution: 0 },
      ],
      'positive whole number of pounds',
    ],
  ])('rejects %s', (_label, holders, message) => {
    expect(() =>
      buildJameyaSchedule({ ...monthlyBase, shareAmount: pounds(1_000), turns: [{ holders }, ...fullTurns(['c'])] }),
    ).toThrow(message);
  });

  it('rejects a share amount that is not whole pounds', () => {
    expect(() => buildJameyaSchedule({ ...monthlyBase, shareAmount: 100_050, turns: fullTurns(['a', 'b']) })).toThrow(
      'whole number of pounds',
    );
  });
});

describe('splitEqually', () => {
  it.each([
    [1_000, 3, [334, 333, 333]],
    [1_000, 4, [250, 250, 250, 250]],
    [1_001, 2, [501, 500]],
    [1_001, 3, [334, 334, 333]],
    [1_003, 4, [251, 251, 251, 250]],
    [1_000, 1, [1_000]],
  ])('splits %i pounds between %i people as %j', (share, count, expected) => {
    const parts = splitEqually(pounds(share), count);

    expect(parts).toEqual(expected.map(pounds));
    expect(parts.reduce((total, part) => total + part, 0)).toBe(pounds(share));
  });
});
