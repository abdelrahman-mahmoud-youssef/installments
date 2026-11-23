import { randomUUID } from 'expo-crypto';
import { useEffect, useState } from 'react';
import { JameyaMoneyEntryInput } from '@/api/jameyas';
import { useI18n } from '@/i18n/i18n-context';
import { parseAmountInput, parseWholeAmountInput, todayIsoDate, toMajorUnitsText, toMinorUnits } from '@/lib/format';

interface MoneyEntryDefaults {
  customerId: string;
  amount: number;
}

export function useJameyaMoneyEntry(visible: boolean, defaults: MoneyEntryDefaults) {
  const { t } = useI18n();
  const [customerId, setCustomerId] = useState('');
  const [amountText, setAmountText] = useState('');
  const [paidAt, setPaidAt] = useState(todayIsoDate());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [clientRequestId, setClientRequestId] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setCustomerId(defaults.customerId);
    setAmountText(defaults.amount > 0 ? toMajorUnitsText(defaults.amount) : '');
    setPaidAt(todayIsoDate());
    setNote('');
    setError(null);
    setClientRequestId(randomUUID());
  }, [visible]);

  const parsedAmount = parseWholeAmountInput(amountText);
  const amount = parsedAmount !== null ? toMinorUnits(parsedAmount) : 0;

  const setAmount = (minorUnits: number) => setAmountText(minorUnits > 0 ? toMajorUnitsText(minorUnits) : '');

  const validationError = (limit: number): string | null => {
    if (!customerId) {
      return t('jameyas.validation.memberRequired');
    }
    if (parsedAmount === null) {
      return parseAmountInput(amountText) === null
        ? t('jameyas.validation.amountPositive')
        : t('jameyas.validation.wholePounds');
    }
    return amount > limit ? t('jameyas.validation.amountAboveLimit') : null;
  };

  const validInput = (limit: number): JameyaMoneyEntryInput | null => {
    const message = validationError(limit);
    setError(message);
    if (message) {
      return null;
    }
    return { customerId, amount, paidAt, note: note.trim() || undefined, clientRequestId };
  };

  return {
    customerId,
    setCustomerId,
    amountText,
    setAmountText,
    amount,
    setAmount,
    paidAt,
    setPaidAt,
    note,
    setNote,
    error,
    setError,
    validInput,
  };
}
