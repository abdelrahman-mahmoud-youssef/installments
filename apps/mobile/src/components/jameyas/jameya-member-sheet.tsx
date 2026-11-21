import { View } from 'react-native';
import { JameyaDetail, JameyaMember } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { MoneyText } from '@/components/ui/money-text';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useJameyaMemberPayments } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaReceiptIconButton } from './jameya-receipt-icon-button';
import { JameyaReminderButton } from './jameya-reminder-button';
import { useShareJameyaReceipt } from './use-share-jameya-receipt';

function MemberFigure({ label, minorUnits, isOwed = false }: { label: string; minorUnits: number; isOwed?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        gap: 2,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <MoneyText minorUnits={minorUnits} variant="bodyStrong" tone={isOwed && minorUnits > 0 ? 'danger' : 'default'} />
    </View>
  );
}

function MemberPayments({ jameya, member }: { jameya: JameyaDetail; member: JameyaMember }) {
  const { t, locale } = useI18n();
  const { data, isPending, isError } = useJameyaMemberPayments(jameya.id, member.customerId);
  const { sharePaymentReceipt, canShare } = useShareJameyaReceipt(jameya.name);

  if (isPending) {
    return <SkeletonCardList count={1} rows={2} />;
  }
  if (isError || !data) {
    return (
      <AppText variant="caption" tone="muted">
        {t('jameyas.detail.member.paymentsLoadError')}
      </AppText>
    );
  }
  if (data.length === 0) {
    return (
      <AppText variant="caption" tone="muted">
        {t('jameyas.detail.member.noPayments')}
      </AppText>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {data.map((payment) => (
        <View key={payment.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="caption">{formatCalendarDate(payment.paidAt, locale)}</AppText>
            {payment.note ? (
              <AppText variant="caption" tone="muted">
                {payment.note}
              </AppText>
            ) : null}
          </View>
          <MoneyText minorUnits={payment.amount} variant="bodyStrong" />
          <JameyaReceiptIconButton
            disabled={!canShare}
            onPress={() =>
              void sharePaymentReceipt({
                memberName: member.name,
                amount: payment.amount,
                paidAt: payment.paidAt,
                note: payment.note,
                balanceAfter: payment.balanceAfter,
              })
            }
          />
        </View>
      ))}
    </View>
  );
}

interface JameyaMemberSheetProps {
  jameya: JameyaDetail;
  customerId: string | null;
  onClose: () => void;
}

export function JameyaMemberSheet({ jameya, customerId, onClose }: JameyaMemberSheetProps) {
  const { t, locale } = useI18n();
  const member = jameya.members.find((item) => item.customerId === customerId);

  return (
    <BottomSheet visible={member !== undefined} onClose={onClose} title={member?.name}>
      {member ? (
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
              {member.turnSequences.length > 1
                ? t('jameyas.customerSection.turnsValue', {
                    sequences: member.turnSequences
                      .map((sequence) => formatNumber(sequence, locale))
                      .join(t('jameyas.customerSection.sequenceSeparator')),
                  })
                : t('jameyas.customerSection.turnValue', { sequence: formatNumber(member.turnSequences[0], locale) })}
            </AppText>
            <JameyaReminderButton member={member} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <MemberFigure label={t('jameyas.detail.member.paid')} minorUnits={member.paidAmount} />
            <MemberFigure label={t('jameyas.detail.member.owes')} minorUnits={member.dueNowAmount} isOwed />
            {member.lateAmount > 0 ? (
              <MemberFigure label={t('jameyas.detail.member.late')} minorUnits={member.lateAmount} isOwed />
            ) : null}
            <MemberFigure label={t('jameyas.detail.member.received')} minorUnits={member.receivedAmount} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyStrong">{t('jameyas.detail.member.payments')}</AppText>
            <MemberPayments jameya={jameya} member={member} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}
