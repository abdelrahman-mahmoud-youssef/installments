import { Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';

Font.register({
  family: 'IBM Plex Sans',
  fonts: [
    { src: '/fonts/pdf/ibm-plex-sans-latin-400.woff', fontWeight: 400 },
    { src: '/fonts/pdf/ibm-plex-sans-latin-600.woff', fontWeight: 600 },
    { src: '/fonts/pdf/ibm-plex-sans-latin-700.woff', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Cairo',
  fonts: [
    { src: '/fonts/pdf/cairo-arabic-400.woff', fontWeight: 400 },
    { src: '/fonts/pdf/cairo-arabic-600.woff', fontWeight: 600 },
    { src: '/fonts/pdf/cairo-arabic-700.woff', fontWeight: 700 },
  ],
});

export type PdfLocale = 'en' | 'ar';

export const PDF_LATIN_FONT = 'IBM Plex Sans';

export const PDF_COLORS = {
  ink: '#1c2333',
  muted: '#6b7280',
  border: '#e2e4ea',
  paper: '#ffffff',
  panel: '#f7f7f9',
  success: '#1f8a57',
  danger: '#c0392b',
};

const ARABIC_FONT = 'Cairo';
const ARABIC_SCRIPT_PATTERN = new RegExp('[\\u0600-\\u06ff\\u0750-\\u077f\\ufb50-\\ufdff\\ufe70-\\ufeff]');

export function pdfFontFamily(locale: PdfLocale): string {
  return locale === 'ar' ? ARABIC_FONT : PDF_LATIN_FONT;
}

export function pdfFontForText(text: string, locale: PdfLocale): string {
  return ARABIC_SCRIPT_PATTERN.test(text) ? ARABIC_FONT : pdfFontFamily(locale);
}

const BIDI_CONTROL_CHARS_PATTERN = new RegExp('[\\u200e\\u200f\\u061c\\u202a-\\u202e\\u2066-\\u2069]', 'g');
const NON_BREAKING_SPACE_PATTERN = new RegExp('\\u00a0', 'g');

export const sanitizeForPdfFont = (text: string) =>
  text.replace(BIDI_CONTROL_CHARS_PATTERN, '').replace(NON_BREAKING_SPACE_PATTERN, ' ');

export const splitMoneyParts = (minorUnits: number, locale: PdfLocale) => {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    numberingSystem: 'latn',
  }).formatToParts(minorUnits / 100);
  const amount = parts
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('');
  const currency = parts.find((part) => part.type === 'currency')?.value ?? '';
  return { amount, currency };
};

const EGP_CURRENCY_OPTIONS = {
  name: 'Egyptian Pound',
  plural: 'Egyptian Pounds',
  symbol: 'EGP',
  fractionalUnit: { name: 'Piastre', plural: 'Piastres', symbol: '' },
};

export const describeAmountInWords = (minorUnits: number, locale: PdfLocale) => {
  const toWords = new ToWords({ localeCode: locale === 'ar' ? 'ar-EG' : 'en-US' });
  const converterOptions = locale === 'ar' ? { currency: true } : { currency: true, currencyOptions: EGP_CURRENCY_OPTIONS };
  return toWords.convert(Math.abs(minorUnits) / 100, converterOptions);
};
