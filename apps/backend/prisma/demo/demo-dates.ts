import { addUtcDays } from '../../src/common/date/utc-date';

const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_MINUTE = 60_000;

export function daysBefore(today: Date, days: number): Date {
  return addUtcDays(today, -days);
}

export function atTime(date: Date, hour: number, minute: number): Date {
  return new Date(date.getTime() + hour * MILLISECONDS_PER_HOUR + minute * MILLISECONDS_PER_MINUTE);
}
