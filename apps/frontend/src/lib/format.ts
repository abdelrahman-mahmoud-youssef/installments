import { format } from 'date-fns';

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

export function formatDate(date: string | Date): string {
  const parsed = new Date(date);
  const utcDate = new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  return format(utcDate, 'dd/MM/yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy, HH:mm');
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

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthYear(monthKey: string, locale = 'en'): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
