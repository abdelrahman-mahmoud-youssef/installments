import { Locale, translations } from '@/i18n/translations';

const ACTION_SEGMENT_SEPARATOR = /\./g;
const TRANSLATION_KEY_SEPARATOR = '_';

export function auditActionLabel(action: string, locale: Locale): string {
  const labels: Record<string, string> = translations[locale].activity.actions;
  return labels[action.replace(ACTION_SEGMENT_SEPARATOR, TRANSLATION_KEY_SEPARATOR)] ?? action;
}
