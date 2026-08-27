import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '@/api/payment-methods';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, maskAccountDetails } from '@/lib/format';
import { resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isPrimary: boolean;
  onPress: () => void;
}

export function PaymentMethodCard({ method, isPrimary, onPress }: PaymentMethodCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const preset = resolvePaymentMethodPreset(method.presetKey);
  const usageRatio = method.monthlyLimit ? method.monthToDateUsage / method.monthlyLimit : 0;
  const usageTone = usageRatio >= 1 ? 'danger' : usageRatio >= 0.8 ? 'warning' : 'primary';

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={method.label}>
      <Card style={{ opacity: method.isActive ? 1 : 0.6 }}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: `${preset.color}1f`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={preset.icon} size={22} color={preset.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {method.label}
              </AppText>
              <PressableScale
                onPress={() => setDetailsVisible((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={detailsVisible ? t('wallets.hideDetails') : t('wallets.showDetails')}
                hitSlop={8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <AppText variant="caption" tone="muted">
                    {detailsVisible ? method.details : maskAccountDetails(method.details)}
                  </AppText>
                  <Ionicons
                    name={detailsVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={14}
                    color={colors.textFaint}
                  />
                </View>
              </PressableScale>
            </View>
            <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
              {isPrimary ? <Badge label={t('wallets.primary')} tone="primary" /> : null}
              {!method.isActive ? <Badge label={t('common.inactive')} tone="neutral" /> : null}
            </View>
          </View>

          {method.monthlyLimit ? (
            <View style={{ gap: spacing.xs }}>
              <ProgressBar ratio={usageRatio} tone={usageTone} />
              <AppText variant="label" tone="muted">
                {t('wallets.usedOfLimit', {
                  used: formatMoney(method.monthToDateUsage, locale),
                  limit: formatMoney(method.monthlyLimit, locale),
                })}
              </AppText>
            </View>
          ) : method.monthToDateUsage > 0 ? (
            <AppText variant="label" tone="muted">
              {t('wallets.usedThisMonth', { used: formatMoney(method.monthToDateUsage, locale) })}
            </AppText>
          ) : null}
        </View>
      </Card>
    </PressableScale>
  );
}
