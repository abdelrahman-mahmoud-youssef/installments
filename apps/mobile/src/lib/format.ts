import type { Locale } from '@/i18n/translations';

const CURRENCY = 'EGP';
const MINOR_UNITS_PER_MAJOR = 100;

export function intlLocale(locale: Locale): string {
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

export function formatPercent(ratio: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
}

export function toMajorUnitsText(minorUnits: number): string {
  return String(minorUnits / MINOR_UNITS_PER_MAJOR);
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * MINOR_UNITS_PER_MAJOR);
}

export function toMajorUnits(minorUnits: number): number {
  return minorUnits / MINOR_UNITS_PER_MAJOR;
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

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_INDIC_ZERO = 0x06f0;
const ARABIC_DIGIT_PATTERN = /[٠-٩۰-۹]/g;
const ARABIC_DECIMAL_SEPARATOR_PATTERN = /٫/g;
const IGNORED_CHARACTERS_PATTERN = /[٬\s]/g;
const GROUPED_THOUSANDS_PATTERN = /^\d{1,3}(,\d{3})+(\.\d+)?$/;
const DECIMAL_COMMA_PATTERN = /^\d+,\d{1,2}$/;
const PLAIN_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function toLatinDigit(digit: string): string {
  const code = digit.charCodeAt(0);
  const zero = code >= EASTERN_ARABIC_INDIC_ZERO ? EASTERN_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
  return String(code - zero);
}

function normalizeSeparators(text: string): string {
  if (GROUPED_THOUSANDS_PATTERN.test(text)) {
    return text.replace(/,/g, '');
  }
  return DECIMAL_COMMA_PATTERN.test(text) ? text.replace(',', '.') : text;
}

export function parseNonNegativeAmountInput(text: string): number | null {
  const latin = text
    .replace(ARABIC_DIGIT_PATTERN, toLatinDigit)
    .replace(IGNORED_CHARACTERS_PATTERN, '')
    .replace(ARABIC_DECIMAL_SEPARATOR_PATTERN, '.');
  const normalized = normalizeSeparators(latin);
  return PLAIN_AMOUNT_PATTERN.test(normalized) ? Number(normalized) : null;
}

export function parseAmountInput(text: string): number | null {
  const amount = parseNonNegativeAmountInput(text);
  return amount !== null && amount > 0 ? amount : null;
}

export function parseCountInput(text: string): number | null {
  const count = parseAmountInput(text);
  return count !== null && Number.isInteger(count) ? count : null;
}

const LTR_ISOLATE_START = '⁦';
const LTR_ISOLATE_END = '⁩';

export function isolateLtr(text: string): string {
  return `${LTR_ISOLATE_START}${text}${LTR_ISOLATE_END}`;
}

export function maskAccountDetails(details: string): string {
  const compact = details.replace(/\s+/g, '');
  if (compact.length <= 4) {
    return details;
  }
  const visible = compact.slice(-4);
  return `•••• ${visible}`;
}
