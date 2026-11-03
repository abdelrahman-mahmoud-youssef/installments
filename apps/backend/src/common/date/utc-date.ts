export function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getUtcToday(): Date {
  return toUtcMidnight(new Date());
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function startOfUtcMonth(date: Date, monthsToAdd = 0): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthsToAdd, 1));
}

export function daysInUtcMonth(monthStart: Date): number {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
}

export function addUtcMonthsClamped(anchor: Date, monthsToAdd: number): Date {
  const targetMonthStart = startOfUtcMonth(anchor, monthsToAdd);
  const targetDay = Math.min(anchor.getUTCDate(), daysInUtcMonth(targetMonthStart));
  return new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth(), targetDay));
}

export function resolveMonthStart(month: string | undefined, today: Date): Date {
  if (!month) {
    return startOfUtcMonth(today);
  }
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}
