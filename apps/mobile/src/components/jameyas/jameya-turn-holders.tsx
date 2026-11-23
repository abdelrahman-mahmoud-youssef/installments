import { View } from 'react-native';
import { JameyaCycle, JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { canHandOverCycle, jameyaMemberName } from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { logicalTextAlign, radius, spacing } from '@/theme/tokens';

interface JameyaTurnHoldersProps {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  canManage: boolean;
  onHandOver: (cycle: JameyaCycle, customerId: string) => void;
}

export function useTurnHoldersLabel(jameya: Pick<JameyaDetail, 'members'>) {
  const { t, locale } = useI18n();
  return (cycle: Pick<JameyaCycle, 'holders'>) => {
    const [first, ...others] = cycle.holders;
    const name = first ? jameyaMemberName(jameya, first.customerId) : '';
    return others.length === 0
      ? name
      : t('jameyas.detail.sharedHolders', { name, count: formatNumber(others.length, locale) });
  };
}

export function JameyaTurnHolders({ jameya, cycle, canManage, onHandOver }: JameyaTurnHoldersProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const canHandOver = canManage && canHandOverCycle(jameya, cycle);
  const period = t(`jameyas.detail.period.${jameya.recurrenceType}`);

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }}>
      {cycle.holders.map((holder, index) => {
        const name = jameyaMemberName(jameya, holder.customerId);
        return (
          <View
            key={holder.customerId}
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderTopWidth: index === 0 ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {t('jameyas.detail.holder.pays', { amount: formatMoney(holder.contribution, locale), period })}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <AppText variant="bodyStrong" align={logicalTextAlign.end}>
                  {t('jameyas.detail.holder.part', { amount: formatMoney(holder.entitlementAmount, locale) })}
                </AppText>
                <AppText variant="caption" tone="muted" align={logicalTextAlign.end}>
                  {holder.remainingAmount > 0
                    ? `${t('jameyas.detail.holder.received', { amount: formatMoney(holder.paidOutAmount, locale) })} · ${t('jameyas.detail.holder.remaining', { amount: formatMoney(holder.remainingAmount, locale) })}`
                    : t('jameyas.detail.holder.received', { amount: formatMoney(holder.paidOutAmount, locale) })}
                </AppText>
              </View>
            </View>
            {canHandOver && holder.remainingAmount > 0 ? (
              <Button
                variant="secondary"
                icon="hand-left-outline"
                title={t('jameyas.detail.handOverTo', { name })}
                onPress={() => onHandOver(cycle, holder.customerId)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
