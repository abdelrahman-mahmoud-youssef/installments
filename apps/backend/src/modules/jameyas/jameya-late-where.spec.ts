import { JameyaDueStatus } from '@prisma/client';
import { addUtcDays } from '../../common/date/utc-date';
import { isJameyaDueLate, lateJameyaDueWhere } from './jameya-late-where';

const today = new Date('2026-11-21');

describe('jameya late rule', () => {
  it('is not late on the lateAfter day and is late the day after', () => {
    expect(isJameyaDueLate(JameyaDueStatus.PENDING, today, today)).toBe(false);
    expect(isJameyaDueLate(JameyaDueStatus.PENDING, today, addUtcDays(today, 1))).toBe(true);
  });

  it('counts a partly paid due as late and a paid one never', () => {
    const yesterday = addUtcDays(today, -1);
    expect(isJameyaDueLate(JameyaDueStatus.PARTIALLY_PAID, yesterday, today)).toBe(true);
    expect(isJameyaDueLate(JameyaDueStatus.PAID, yesterday, today)).toBe(false);
  });

  it('filters with the same boundary in the database query', () => {
    expect(lateJameyaDueWhere(today)).toEqual({
      status: { in: [JameyaDueStatus.PENDING, JameyaDueStatus.PARTIALLY_PAID] },
      cycle: { lateAfter: { lt: today } },
    });
  });
});
