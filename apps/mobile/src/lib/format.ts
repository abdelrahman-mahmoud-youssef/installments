import type { Locale } from '@/i18n/translations';

const CURRENCY = 'EGP';
const MINOR_UNITS_PER_MAJOR = 100;

function intlLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar-EG' : 'en-EG';
}

export function formatMoney(minorUnits: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: minorUnits % MINOR_UNITS_PER_MAJOR === 0 ? 0 : 2,
  }).format(minorUnits / MINOR_UNITS_PER_MAJOR);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * MINOR_UNITS_PER_MAJOR);
}

export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDateTime(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function maskAccountDetails(details: string): string {
  const compact = details.replace(/\s+/g, '');
  if (compact.length <= 4) {
    return details;
  }
  const visible = compact.slice(-4);
  return `•••• ${visible}`;
}
