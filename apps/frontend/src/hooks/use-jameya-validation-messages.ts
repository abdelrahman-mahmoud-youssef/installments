import { useTranslations } from 'next-intl';
import { JameyaValidationMessages } from '@/lib/schemas/jameya';

export function useJameyaValidationMessages(): JameyaValidationMessages {
  const t = useTranslations('jameyas.validation');
  return {
    nameRequired: t('nameRequired'),
    nameTooLong: t('nameTooLong'),
    shareAmountPositive: t('shareAmountPositive'),
    firstDueDateRequired: t('firstDueDateRequired'),
    graceDaysRange: t('graceDaysRange'),
    noteTooLong: t('noteTooLong'),
    memberRequired: t('memberRequired'),
    amountPositive: t('amountPositive'),
    wholePounds: t('wholePounds'),
    amountAboveLimit: t('amountAboveLimit'),
    dateRequired: t('dateRequired'),
  };
}
