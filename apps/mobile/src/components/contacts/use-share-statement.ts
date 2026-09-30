import { useCallback } from 'react';
import { Share } from 'react-native';
import { Counterparty } from '@/api/counterparties';
import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/ui/toast-context';
import { useI18n } from '@/i18n/i18n-context';
import { balanceStatus } from '@/lib/counterparty-balance';
import { formatDate, formatMoney, isolateLtr, todayIsoDate } from '@/lib/format';

export function useShareStatement() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { showToast } = useToast();

  return useCallback(
    async (contact: Counterparty) => {
      const shopName = user?.tenant.displayName ?? t('common.appName');
      const lines = [
        t('contacts.statementTitle', { shop: shopName }),
        t('contacts.statementDate', { date: formatDate(todayIsoDate(), locale) }),
        '',
        t('contacts.statementContact', { name: contact.name }),
        contact.phone ? t('contacts.statementPhone', { phone: isolateLtr(contact.phone) }) : null,
        t('contacts.statementBalance', {
          amount: formatMoney(Math.abs(contact.balance), locale),
          status: t(`contacts.${balanceStatus(contact.balance)}`),
        }),
      ];
      try {
        await Share.share({ message: lines.filter((line) => line !== null).join('\n') });
      } catch {
        showToast(t('common.genericError'), 'error');
      }
    },
    [locale, showToast, t, user],
  );
}
