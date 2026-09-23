import { View } from 'react-native';
import { Counterparty } from '@/api/counterparties';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { balanceStatus, balanceTone } from '@/lib/counterparty-balance';
import { spacing } from '@/theme/tokens';

interface ContactRowProps {
  contact: Counterparty;
  onPress: () => void;
}

export function ContactRow({ contact, onPress }: ContactRowProps) {
  const { t } = useI18n();
  const status = balanceStatus(contact.balance);

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={contact.name}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={contact.name} photoUrl={contact.photoUrl} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {contact.name}
            </AppText>
            {contact.phone ? (
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {contact.phone}
              </AppText>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <MoneyText minorUnits={Math.abs(contact.balance)} variant="bodyStrong" tone={balanceTone[status]} />
            <AppText variant="label" tone="muted">
              {t(`contacts.${status}`)}
            </AppText>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
