import type { Locale } from '@/i18n/translations';
import { intlLocale, toIsoDate, toLatinDigits } from './format';

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
  return toLatinDigits(
    new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(parseMonthKey(monthKey)),
  );
}

export function shiftIsoDateByMonths(isoDate: string, months: number): string {
  const anchor = parseIsoDate(isoDate);
  const targetMonthStart = new Date(anchor.getFullYear(), anchor.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth() + 1,
    0,
  ).getDate();
  return toIsoDate(
    new Date(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth(),
      Math.min(anchor.getDate(), lastDayOfTargetMonth),
    ),
  );
}

export function formatShortWeekday(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short' }).format(parseIsoDate(isoDate));
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

const DAYS_PER_WEEK = 7;
const SATURDAY = 6;
const WEEKDAY_REFERENCE_SATURDAY = new Date(2026, 0, 3);

export function monthKeyOfIsoDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function buildMonthWeeks(monthKey: string): (string | null)[][] {
  const firstDay = parseMonthKey(monthKey);
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() - SATURDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      toIsoDate(new Date(firstDay.getFullYear(), firstDay.getMonth(), index + 1)),
    ),
  ];
  while (cells.length % DAYS_PER_WEEK !== 0) {
    cells.push(null);
  }
  return Array.from({ length: cells.length / DAYS_PER_WEEK }, (_, week) =>
    cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK),
  );
}

export function weekdayInitials(locale: Locale): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'narrow' });
  return Array.from({ length: DAYS_PER_WEEK }, (_, offset) =>
    formatter.format(
      new Date(
        WEEKDAY_REFERENCE_SATURDAY.getFullYear(),
        WEEKDAY_REFERENCE_SATURDAY.getMonth(),
        WEEKDAY_REFERENCE_SATURDAY.getDate() + offset,
      ),
    ),
  );
}
