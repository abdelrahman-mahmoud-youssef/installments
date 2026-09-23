import type { Locale } from '@/i18n/translations';
import { toIsoDate } from './format';

function monthKeyOf(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function shiftMonthKey(monthKey: string, months: number): string {
  const date = parseMonthKey(monthKey);
  date.setMonth(date.getMonth() + months);
  return monthKeyOf(date);
}

export function formatMonthKey(monthKey: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { month: 'long', year: 'numeric' }).format(
    parseMonthKey(monthKey),
  );
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}
