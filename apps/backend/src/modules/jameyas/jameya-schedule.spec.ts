import { RecurrenceType } from '@prisma/client';
import { calculateEntitlement, calculatePot } from './jameya-amounts';
import { buildJameyaSchedule, JameyaTurnHolder } from './jameya-schedule';

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fullTurns(customerIds: string[]): JameyaTurnHolder[][] {
  return customerIds.map((customerId) => [{ customerId, halves: 2 }]);
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

  it('gives each turn its holder and makes every member owe one share in every cycle', () => {
    const schedule = buildJameyaSchedule({
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2027-01-10'),
      graceDays: 0,
      turns: fullTurns(['a', 'b', 'c']),
    });

    expect(schedule.cycles.map((cycle) => cycle.holders)).toEqual(fullTurns(['a', 'b', 'c']));
    expect(schedule.dues).toHaveLength(9);
    expect(schedule.dues.every((due) => due.amount === 100_000)).toBe(true);
    for (const cycle of schedule.cycles) {
      const collectedWhenAllPay = schedule.dues
        .filter((due) => due.sequence === cycle.sequence)
        .reduce((total, due) => total + due.amount, 0);
      expect(collectedWhenAllPay).toBe(calculatePot(100_000, 3));
    }
  });

  it('charges half and double holders by their total halves', () => {
    const schedule = buildJameyaSchedule({
      shareAmount: 100_000,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2027-01-10'),
      graceDays: 0,
      turns: [
        [
          { customerId: 'half-a', halves: 1 },
          { customerId: 'half-b', halves: 1 },
        ],
        [{ customerId: 'double', halves: 2 }],
        [{ customerId: 'double', halves: 2 }],
      ],
    });

    const firstCycleDues = schedule.dues.filter((due) => due.sequence === 1);
    expect(firstCycleDues).toEqual([
      { sequence: 1, customerId: 'half-a', amount: 50_000 },
      { sequence: 1, customerId: 'half-b', amount: 50_000 },
      { sequence: 1, customerId: 'double', amount: 200_000 },
    ]);
  });

  it('rejects a turn that is not exactly one share and an odd share split into halves', () => {
    const base = {
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2027-01-10'),
      graceDays: 0,
    };

    expect(() =>
      buildJameyaSchedule({
        ...base,
        shareAmount: 100_000,
        turns: [[{ customerId: 'a', halves: 1 }], fullTurns(['b'])[0]],
      }),
    ).toThrow('Every turn must add up to exactly one full share.');
    expect(() =>
      buildJameyaSchedule({
        ...base,
        shareAmount: 100_001,
        turns: [
          [
            { customerId: 'a', halves: 1 },
            { customerId: 'b', halves: 1 },
          ],
          fullTurns(['c'])[0],
        ],
      }),
    ).toThrow('The share amount must split evenly into two halves.');
  });
});

describe('pot and entitlement', () => {
  it('pays a full holder the whole pot and a half holder half of it', () => {
    const pot = calculatePot(100_000, 10);

    expect(pot).toBe(1_000_000);
    expect(calculateEntitlement(pot, 2)).toBe(1_000_000);
    expect(calculateEntitlement(pot, 1)).toBe(500_000);
  });
});
