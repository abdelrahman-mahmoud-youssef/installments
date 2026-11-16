const MILLISECONDS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINIMUM_VISIBLE_AGE_MINUTES = 1;

export type DataAgeUnit = 'minutes' | 'hours' | 'days';

export interface DataAge {
  unit: DataAgeUnit;
  count: number;
}

export function describeDataAge(updatedAt: number, now: number): DataAge | null {
  const ageInMinutes = Math.floor((now - updatedAt) / MILLISECONDS_PER_MINUTE);
  if (ageInMinutes < MINIMUM_VISIBLE_AGE_MINUTES) {
    return null;
  }
  if (ageInMinutes < MINUTES_PER_HOUR) {
    return { unit: 'minutes', count: ageInMinutes };
  }
  const ageInHours = Math.floor(ageInMinutes / MINUTES_PER_HOUR);
  if (ageInHours < HOURS_PER_DAY) {
    return { unit: 'hours', count: ageInHours };
  }
  return { unit: 'days', count: Math.floor(ageInHours / HOURS_PER_DAY) };
}
