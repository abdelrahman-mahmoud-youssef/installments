import { RecurrenceType } from '@prisma/client';
import { generateDueDates } from './recurrence';

function isoDates(dates: Date[]): string[] {
  return dates.map((date) => date.toISOString().slice(0, 10));
}

describe('generateDueDates', () => {
  it('handles monthly recurrence anchored on the 31st across short months, returning to 31 whenever possible', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2026-01-31T00:00:00.000Z'),
      recurrenceType: RecurrenceType.MONTHLY,
      installmentCount: 5,
    });

    expect(isoDates(dueDates)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
    ]);
  });

  it('lands on 29 February during a leap year', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2024-01-31T00:00:00.000Z'),
      recurrenceType: RecurrenceType.MONTHLY,
      installmentCount: 2,
    });

    expect(isoDates(dueDates)).toEqual(['2024-01-31', '2024-02-29']);
  });

  it('never permanently shifts the anchor day after a clamped month', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2025-01-31T00:00:00.000Z'),
      recurrenceType: RecurrenceType.MONTHLY,
      installmentCount: 3,
    });

    expect(isoDates(dueDates)).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });

  it('generates weekly occurrences seven days apart', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2026-03-02T00:00:00.000Z'),
      recurrenceType: RecurrenceType.WEEKLY,
      installmentCount: 3,
    });

    expect(isoDates(dueDates)).toEqual(['2026-03-02', '2026-03-09', '2026-03-16']);
  });

  it('generates biweekly occurrences fourteen days apart', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2026-03-02T00:00:00.000Z'),
      recurrenceType: RecurrenceType.BIWEEKLY,
      installmentCount: 3,
    });

    expect(isoDates(dueDates)).toEqual(['2026-03-02', '2026-03-16', '2026-03-30']);
  });

  it('generates occurrences using a custom interval in days', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2026-03-02T00:00:00.000Z'),
      recurrenceType: RecurrenceType.EVERY_X_DAYS,
      installmentCount: 3,
      intervalDays: 10,
    });

    expect(isoDates(dueDates)).toEqual(['2026-03-02', '2026-03-12', '2026-03-22']);
  });

  it('throws when EVERY_X_DAYS is used without intervalDays', () => {
    expect(() =>
      generateDueDates({
        firstPaymentDate: new Date('2026-03-02T00:00:00.000Z'),
        recurrenceType: RecurrenceType.EVERY_X_DAYS,
        installmentCount: 3,
      }),
    ).toThrow();
  });

  it('always starts the first occurrence on the firstPaymentDate itself', () => {
    const dueDates = generateDueDates({
      firstPaymentDate: new Date('2026-06-15T00:00:00.000Z'),
      recurrenceType: RecurrenceType.MONTHLY,
      installmentCount: 1,
    });

    expect(isoDates(dueDates)).toEqual(['2026-06-15']);
  });
});
