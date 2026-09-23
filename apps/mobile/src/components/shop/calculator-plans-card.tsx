import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { CalculatorPlan } from '@/api/branding';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber, parseNonNegativeAmountInput } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

const PRESET_MONTHS = [3, 6, 9, 12] as const;
const MAX_MARKUP_PERCENT = 1000;
const MARKUP_INPUT_WIDTH = 96;

interface PlanDraft {
  enabled: boolean;
  markup: string;
}

type PlanDrafts = Record<number, PlanDraft>;

interface CalculatorPlansCardProps {
  plans: CalculatorPlan[];
  saving: boolean;
  onSave: (plans: CalculatorPlan[]) => void;
}

function toDrafts(plans: CalculatorPlan[]): PlanDrafts {
  return Object.fromEntries(
    PRESET_MONTHS.map((months) => {
      const plan = plans.find((candidate) => candidate.months === months);
      return [months, { enabled: plan !== undefined, markup: plan ? String(plan.markupPercent) : '' }];
    }),
  );
}

function isPresetMonth(months: number): boolean {
  return PRESET_MONTHS.some((preset) => preset === months);
}

export function CalculatorPlansCard({ plans, saving, onSave }: CalculatorPlansCardProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const [drafts, setDrafts] = useState<PlanDrafts>(() => toDrafts(plans));
  const [invalidMonths, setInvalidMonths] = useState<number[]>([]);

  useEffect(() => {
    setDrafts(toDrafts(plans));
  }, [plans]);

  const updateDraft = (months: number, change: Partial<PlanDraft>) =>
    setDrafts((current) => ({ ...current, [months]: { ...current[months], ...change } }));

  const save = () => {
    const enabledMonths = PRESET_MONTHS.filter((months) => drafts[months].enabled);
    const parsed = enabledMonths.map((months) => ({
      months,
      markupPercent: parseNonNegativeAmountInput(drafts[months].markup || '0'),
    }));
    const invalid = parsed
      .filter((plan) => plan.markupPercent === null || plan.markupPercent > MAX_MARKUP_PERCENT)
      .map((plan) => plan.months);
    setInvalidMonths(invalid);
    if (invalid.length > 0) {
      return;
    }
    const preservedPlans = plans.filter((plan) => !isPresetMonth(plan.months));
    onSave([...preservedPlans, ...parsed.map((plan) => ({ months: plan.months, markupPercent: plan.markupPercent ?? 0 }))]);
  };

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <AppText variant="caption" tone="muted">
          {t('shopExtras.plansHint')}
        </AppText>
        {PRESET_MONTHS.map((months) => {
          const draft = drafts[months];
          return (
            <View key={months} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Switch
                value={draft.enabled}
                onValueChange={(enabled) => updateDraft(months, { enabled })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {t('shopExtras.monthsPlan', { months: formatNumber(months, locale) })}
              </AppText>
              <View style={{ width: MARKUP_INPUT_WIDTH }}>
                <TextField
                  label={t('shopExtras.markup')}
                  value={draft.markup}
                  onChangeText={(markup) => updateDraft(months, { markup })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  editable={draft.enabled}
                  error={invalidMonths.includes(months) ? t('shopExtras.invalidMarkup') : undefined}
                />
              </View>
            </View>
          );
        })}
        <Button title={t('shopExtras.savePlans')} variant="secondary" onPress={save} loading={saving} />
      </View>
    </Card>
  );
}
