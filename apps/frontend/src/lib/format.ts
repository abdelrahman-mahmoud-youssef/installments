export function formatMoney(minorUnits: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    numberingSystem: 'latn',
  }).format(minorUnits / 100);
}

export function formatCompactMoney(minorUnits: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
    numberingSystem: 'latn',
  }).format(minorUnits / 100);
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

export function formatDate(date: string | Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  }).format(new Date(date));
}

export function formatWeekday(date: string | Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  }).format(new Date(date));
}
