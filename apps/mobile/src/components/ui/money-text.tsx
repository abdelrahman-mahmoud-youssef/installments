import { ComponentProps } from 'react';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney } from '@/lib/format';
import { AppText } from './app-text';

interface MoneyTextProps extends Omit<ComponentProps<typeof AppText>, 'children'> {
  minorUnits: number;
}

export function MoneyText({ minorUnits, ...rest }: MoneyTextProps) {
  const { locale } = useI18n();
  return <AppText {...rest}>{formatMoney(minorUnits, locale)}</AppText>;
}
