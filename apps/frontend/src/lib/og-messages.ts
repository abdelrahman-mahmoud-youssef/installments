import enMessages from '../../messages/en.json';
import arMessages from '../../messages/ar.json';

const MESSAGES_BY_LOCALE: Record<string, typeof enMessages> = {
  en: enMessages,
  ar: arMessages,
};

export function ogMessage(
  locale: string,
  namespace: 'publicShop' | 'publicCustomer',
  key: string,
  vars: Record<string, string> = {},
): string {
  const messages = MESSAGES_BY_LOCALE[locale] ?? enMessages;
  const template = (messages[namespace] as Record<string, string>)[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, token) => vars[token] ?? match);
}
