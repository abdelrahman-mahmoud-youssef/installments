import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { KEYBOARD_DONE_BAR_ID } from '@/components/ui/keyboard-done-bar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import {
  amountLeftToSplit,
  isCustomSplit,
  JAMEYA_TURN_SPLITS,
  JameyaTurnSplit,
  WizardTurn,
} from '@/lib/jameya-wizard';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JAMEYA_MAX_HOLDERS_PER_TURN } from '../jameya-limits';

interface JameyaOrderStepProps {
  turns: WizardTurn[];
  shareAmount: number;
  previewContributionOf: (turnIndex: number, customerId: string) => number | undefined;
  onMove: (from: number, to: number) => void;
  onShuffle: () => void;
  onAddPartner: (turnIndex: number) => void;
  onRemovePartner: (turnIndex: number, customerId: string) => void;
  onSplit: (turnIndex: number, split: JameyaTurnSplit) => void;
  onAmount: (turnIndex: number, customerId: string, amountText: string) => void;
}

interface IconActionProps {
  icon: 'chevron-up' | 'chevron-down' | 'close-circle' | 'person-add-outline';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function IconAction({ icon, label, disabled = false, onPress }: IconActionProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={spacing.xs}
      style={{ padding: spacing.xs, opacity: disabled ? 0.3 : 1 }}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </PressableScale>
  );
}

function SplitBalance({ turn, shareAmount }: { turn: WizardTurn; shareAmount: number }) {
  const { t, locale } = useI18n();
  const left = amountLeftToSplit(turn, shareAmount);
  if (left === 0) {
    return (
      <AppText variant="caption" tone="success">
        {t('jameyas.new.splitDone')}
      </AppText>
    );
  }
  const amount = formatMoney(Math.abs(left), locale);
  return (
    <AppText variant="caption" tone="danger">
      {left > 0 ? t('jameyas.new.leftToSplit', { amount }) : t('jameyas.new.overSplit', { amount })}
    </AppText>
  );
}

function TurnSplit({
  turn,
  index,
  shareAmount,
  previewContributionOf,
  onSplit,
  onAmount,
}: Pick<JameyaOrderStepProps, 'shareAmount' | 'previewContributionOf' | 'onSplit' | 'onAmount'> & {
  turn: WizardTurn;
  index: number;
}) {
  const { t, locale } = useI18n();
  const isCustom = isCustomSplit(turn);
  return (
    <View style={{ gap: spacing.sm }}>
      <SegmentedControl
        options={JAMEYA_TURN_SPLITS.map((split) => ({ value: split, label: t(`jameyas.new.split.${split}`) }))}
        selected={turn.split}
        onSelect={(split) => onSplit(index, split)}
      />
      {turn.holders.map((holder) => {
        if (isCustom) {
          return (
            <TextField
              key={holder.id}
              label={holder.name}
              value={holder.amountText}
              onChangeText={(amountText) => onAmount(index, holder.id, amountText)}
              keyboardType="number-pad"
              placeholder="0"
              accessibilityLabel={t('jameyas.new.partAmount', { name: holder.name })}
              inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
            />
          );
        }
        const previewContribution = previewContributionOf(index, holder.id);
        return (
          <View key={holder.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
              {holder.name}
            </AppText>
            <AppText variant="bodyStrong" tone={previewContribution === undefined ? 'muted' : 'default'}>
              {previewContribution === undefined ? t('jameyas.new.splitPending') : formatMoney(previewContribution, locale)}
            </AppText>
          </View>
        );
      })}
      {isCustom ? <SplitBalance turn={turn} shareAmount={shareAmount} /> : null}
    </View>
  );
}

export function JameyaOrderStep(props: JameyaOrderStepProps) {
  const { turns, onMove, onShuffle, onAddPartner, onRemovePartner } = props;
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.orderHint', { max: formatNumber(JAMEYA_MAX_HOLDERS_PER_TURN, locale) })}
      </AppText>
      <Button variant="secondary" icon="shuffle-outline" title={t('jameyas.new.randomOrder')} onPress={onShuffle} />
      {turns.map((turn, index) => {
        const isShared = turn.holders.length > 1;
        const firstName = turn.holders[0].name;
        return (
          <Card key={turn.turnId}>
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                  {t('jameyas.new.turnNumber', { sequence: formatNumber(index + 1, locale) })}
                </AppText>
                <IconAction
                  icon="person-add-outline"
                  label={t('jameyas.new.addPartnerTo', { sequence: formatNumber(index + 1, locale) })}
                  disabled={turn.holders.length >= JAMEYA_MAX_HOLDERS_PER_TURN}
                  onPress={() => onAddPartner(index)}
                />
                <IconAction
                  icon="chevron-up"
                  label={t('jameyas.new.moveUp', { name: firstName })}
                  disabled={index === 0}
                  onPress={() => onMove(index, index - 1)}
                />
                <IconAction
                  icon="chevron-down"
                  label={t('jameyas.new.moveDown', { name: firstName })}
                  disabled={index === turns.length - 1}
                  onPress={() => onMove(index, index + 1)}
                />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {turn.holders.map((holder) => (
                  <View
                    key={holder.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      paddingVertical: spacing.xs,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.full,
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {holder.name}
                    </AppText>
                    {isShared ? (
                      <IconAction
                        icon="close-circle"
                        label={t('jameyas.new.removePartner', { name: holder.name })}
                        onPress={() => onRemovePartner(index, holder.id)}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
              {isShared ? <TurnSplit {...props} turn={turn} index={index} /> : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
