'use client';

import { useLocale } from 'next-intl';
import { formatDate } from '@/lib/format';

export function DateText({ value, className }: { value: string | Date; className?: string }) {
  const locale = useLocale();
  return <span className={className}>{formatDate(value, locale)}</span>;
}
