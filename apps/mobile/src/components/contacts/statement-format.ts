import type { Locale } from '@/i18n/translations';
import { toMajorUnits } from '@/lib/format';

const STATEMENT_CURRENCY_LABEL: Record<Locale, string> = {
  en: 'EGP',
  ar: 'ج.م.',
};

const THOUSANDS_GROUP_PATTERN = /\B(?=(\d{3})+(?!\d))/g;
const AMOUNT_DECIMALS = 2;

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

export interface StatementMoneyOptions {
  hideWholeDecimals?: boolean;
}

export function splitStatementMoney(
  minorUnits: number,
  locale: Locale,
  options: StatementMoneyOptions = {},
): { currency: string; amount: string } {
  const [whole, fraction] = toMajorUnits(Math.abs(minorUnits)).toFixed(AMOUNT_DECIMALS).split('.');
  const groupedWhole = whole.replace(THOUSANDS_GROUP_PATTERN, ',');
  const showFraction = !options.hideWholeDecimals || Number(fraction) !== 0;
  return {
    currency: STATEMENT_CURRENCY_LABEL[locale],
    amount: showFraction ? `${groupedWhole}.${fraction}` : groupedWhole,
  };
}

export function formatStatementDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${padTwo(date.getUTCDate())}/${padTwo(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function formatStatementDateTime(date: Date): string {
  const day = `${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${day}, ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
}
