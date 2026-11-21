import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { JameyaCycle, JameyaDetail, JameyaMoneyEntryInput, JameyaPayoutResult } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { TextField } from '@/components/ui/text-field';
import { useCreateJameyaPayout } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber, todayIsoDate } from '@/lib/format';
import {
  amountFromShopMoney,
  availableCycleCash,
  jameyaMemberName,
  suggestedPayoutAmount,
} from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaFigures } from './jameya-figures';
import { JAMEYA_NOTE_MAX_LENGTH } from './jameya-limits';
import { useJameyaMoneyEntry } from './use-jameya-money-entry';
import { useShareJameyaReceipt } from './use-share-jameya-receipt';

interface JameyaPayoutSheetProps {
  visible: boolean;
  jameya: JameyaDetail;
  cycle: JameyaCycle | null;
  onClose: () => void;
}

interface PayoutResultProps {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  result: JameyaPayoutResult;
  onDone: () => void;
}

function PayoutResult({ jameya, cycle, result, onDone }: PayoutResultProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { sharePayoutReceipt, canShare } = useShareJameyaReceipt(jameya.name);
  const holderName = jameyaMemberName(jameya, result.customerId);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        <AppText variant="bodyStrong" tone="success" style={{ flex: 1 }}>
          {t('jameyas.payoutDialog.handedOver', { name: holderName })}
        </AppText>
      </View>
      <JameyaFigures
        figures={[
          { label: t('jameyas.payoutDialog.amount'), minorUnits: result.amount },
          {
            label: t('jameyas.payoutDialog.shopCovered'),
            minorUnits: result.coveredAmount,
            tone: result.coveredAmount > 0 ? 'warning' : undefined,
          },
          { label: t('jameyas.payoutDialog.stillOwedForTurn'), minorUnits: result.remainingAmount },
        ]}
      />
      <Button
        variant="secondary"
        icon="document-text-outline"
        title={t('jameyas.receipt.download')}
        disabled={!canShare}
        onPress={() =>
          void sharePayoutReceipt({ holderName, cycle, payout: result, remainingAmount: result.remainingAmount })
        }
      />
      <Button title={t('jameyas.payoutDialog.done')} onPress={onDone} />
    </View>
  );
}

interface PayoutFormProps {
  visible: boolean;
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  saving: boolean;
  onSubmit: (input: JameyaMoneyEntryInput) => Promise<void>;
}

function PayoutForm({ visible, jameya, cycle, saving, onSubmit }: PayoutFormProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const openHolders = cycle.holders.filter((holder) => holder.remainingAmount > 0);
  const availableCash = availableCycleCash(cycle);
  const remainingFor = (customerId: string) =>
    cycle.holders.find((holder) => holder.customerId === customerId)?.remainingAmount ?? 0;
  const suggestedFor = (customerId: string) => suggestedPayoutAmount(remainingFor(customerId), cycle.collectedAmount);
  const firstHolderId = openHolders[0]?.customerId ?? '';
  const entry = useJameyaMoneyEntry(visible, { customerId: firstHolderId, amount: suggestedFor(firstHolderId) });
  const fromShopMoney = amountFromShopMoney(entry.amount, availableCash);

  const chooseHolder = (customerId: string) => {
    entry.setCustomerId(customerId);
    entry.setAmount(suggestedFor(customerId));
  };

  const submit = async () => {
    const input = entry.validInput(remainingFor(entry.customerId));
    if (!input) {
      return;
    }
    try {
      await onSubmit(input);
    } catch (error) {
      entry.setError(error instanceof ApiError ? error.message : t('jameyas.payoutDialog.payoutError'));
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.payoutDialog.description')}
      </AppText>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('jameyas.payoutDialog.holder')}
        </AppText>
        <ChoiceChips
          options={openHolders.map((holder) => ({
            value: holder.customerId,
            label: jameyaMemberName(jameya, holder.customerId),
          }))}
          selected={entry.customerId || null}
          onSelect={chooseHolder}
        />
      </View>

      <JameyaFigures
        figures={[
          { label: t('jameyas.payoutDialog.stillOwedForTurn'), minorUnits: remainingFor(entry.customerId) },
          { label: t('jameyas.payoutDialog.availableCash'), minorUnits: availableCash },
        ]}
      />

      <TextField
        label={t('jameyas.payoutDialog.amount')}
        value={entry.amountText}
        onChangeText={entry.setAmountText}
        keyboardType="decimal-pad"
        placeholder="0"
        error={entry.error ?? undefined}
      />

      {fromShopMoney > 0 ? (
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            backgroundColor: colors.warningMuted,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Ionicons name="warning-outline" size={18} color={colors.warning} />
          <AppText variant="caption" tone="warning" style={{ flex: 1 }}>
            {`${t('jameyas.payoutDialog.fromShopMoneyPrefix')} ${formatMoney(fromShopMoney, locale)} ${t('jameyas.payoutDialog.fromShopMoneySuffix')}`}
          </AppText>
        </View>
      ) : null}

      <DateStepper
        label={t('jameyas.payoutDialog.paidAt')}
        value={entry.paidAt}
        onChange={entry.setPaidAt}
        maxDate={todayIsoDate()}
      />

      <TextField
        label={t('jameyas.payoutDialog.note')}
        placeholder={t('jameyas.payoutDialog.notePlaceholder')}
        value={entry.note}
        onChangeText={entry.setNote}
        multiline
        maxLength={JAMEYA_NOTE_MAX_LENGTH}
      />

      <Button
        title={t('jameyas.payoutDialog.submit')}
        onPress={() => void submit()}
        loading={saving}
        disabled={openHolders.length === 0}
      />
    </View>
  );
}

export function JameyaPayoutSheet({ visible, jameya, cycle, onClose }: JameyaPayoutSheetProps) {
  const { t, locale } = useI18n();
  const createPayout = useCreateJameyaPayout(jameya.id);
  const [result, setResult] = useState<JameyaPayoutResult | null>(null);

  useEffect(() => {
    if (visible) {
      setResult(null);
    }
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={createPayout.isPending ? () => undefined : onClose}
      title={cycle ? t('jameyas.payoutDialog.title', { sequence: formatNumber(cycle.sequence, locale) }) : undefined}
    >
      {cycle && result ? <PayoutResult jameya={jameya} cycle={cycle} result={result} onDone={onClose} /> : null}
      {cycle && !result ? (
        <PayoutForm
          visible={visible}
          jameya={jameya}
          cycle={cycle}
          saving={createPayout.isPending}
          onSubmit={async (input) => setResult(await createPayout.mutateAsync({ cycleId: cycle.id, input }))}
        />
      ) : null}
    </BottomSheet>
  );
}
