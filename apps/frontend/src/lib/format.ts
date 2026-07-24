export function formatMoney(minorUnits: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    numberingSystem: 'latn',
  }).format(minorUnits / 100);
}

export function formatCompactMoney(minorUnits: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
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

export function formatDateTime(date: string | Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
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

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}
