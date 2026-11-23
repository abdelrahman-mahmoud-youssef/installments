import { NotificationLanguage } from '@prisma/client';

function numberLocale(language: NotificationLanguage): string {
  return language === NotificationLanguage.AR ? 'ar-EG' : 'en-US';
}

export function formatCount(count: number, language: NotificationLanguage): string {
  return new Intl.NumberFormat(numberLocale(language)).format(count);
}

export interface MoneyFormatOptions {
  hideWholeDecimals?: boolean;
}

export function formatMoney(
  minorUnits: number,
  language: NotificationLanguage,
  options: MoneyFormatOptions = {},
): string {
  const locale = numberLocale(language);
  const fractionDigits = options.hideWholeDecimals && minorUnits % 100 === 0 ? 0 : 2;
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(minorUnits / 100);
  return language === NotificationLanguage.AR ? `${amount} ج.م` : `EGP ${amount}`;
}

export function formatDate(date: Date, language: NotificationLanguage): string {
  const locale = language === NotificationLanguage.AR ? 'ar-EG' : 'en-GB';
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
