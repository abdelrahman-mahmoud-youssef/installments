import { useState } from 'react';
import { View } from 'react-native';
import { JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { JameyaReminderButton } from './jameya-reminder-button';

const VISIBLE_UNPAID_MEMBERS = 5;

interface JameyaUnpaidMembersProps {
  jameya: JameyaDetail;
  onOpenMember: (customerId: string) => void;
}

export function JameyaUnpaidMembers({ jameya, onOpenMember }: JameyaUnpaidMembersProps) {
  const { t, locale } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const unpaid = jameya.members
    .filter((member) => member.dueNowAmount > 0)
    .sort((first, second) => second.dueNowAmount - first.dueNowAmount);
  const visible = showAll ? unpaid : unpaid.slice(0, VISIBLE_UNPAID_MEMBERS);

  return (
    <Card>
      {unpaid.length === 0 ? (
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.everyonePaid')}
        </AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          {visible.map((member) => (
            <View key={member.customerId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <PressableScale
                onPress={() => onOpenMember(member.customerId)}
                accessibilityRole="button"
                style={{ flex: 1 }}
              >
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {member.name}
                </AppText>
              </PressableScale>
              <AppText variant="bodyStrong" tone="danger">
                {t('jameyas.detail.owes', { amount: formatMoney(member.dueNowAmount, locale) })}
              </AppText>
              <JameyaReminderButton member={member} />
            </View>
          ))}
          {unpaid.length > VISIBLE_UNPAID_MEMBERS ? (
            <Button
              variant="ghost"
              title={showAll ? t('jameyas.detail.showLess') : t('jameyas.detail.showAll')}
              onPress={() => setShowAll((current) => !current)}
            />
          ) : null}
        </View>
      )}
    </Card>
  );
}
