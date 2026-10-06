import { ToWords } from 'to-words';
import type { Locale } from '@/i18n/translations';
import { toMajorUnits } from './format';

const EGP_CURRENCY_OPTIONS = {
  name: 'Egyptian Pound',
  plural: 'Egyptian Pounds',
  symbol: 'EGP',
  fractionalUnit: { name: 'Piastre', plural: 'Piastres', symbol: '' },
};

export function describeAmountInWords(minorUnits: number, locale: Locale): string {
  const amount = toMajorUnits(Math.abs(minorUnits));
  if (locale === 'ar') {
    return new ToWords({ localeCode: 'ar-EG' }).convert(amount, { currency: true });
  }
  return new ToWords({ localeCode: 'en-US' }).convert(amount, {
    currency: true,
    currencyOptions: EGP_CURRENCY_OPTIONS,
  });
}
