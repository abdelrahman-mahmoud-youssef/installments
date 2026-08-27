import { NotificationLanguage } from '@prisma/client';

export function formatMoney(minorUnits: number, language: NotificationLanguage): string {
  const locale = language === NotificationLanguage.AR ? 'ar-EG' : 'en-US';
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
  return language === NotificationLanguage.AR ? `${amount} ج.م` : `EGP ${amount}`;
}

export function formatDate(date: Date, language: NotificationLanguage): string {
  const locale = language === NotificationLanguage.AR ? 'ar-EG' : 'en-GB';
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
