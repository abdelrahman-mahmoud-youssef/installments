import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/auth-context';
import { ContactFormSheet } from '@/components/contacts/contact-form-sheet';
import { ContactList } from '@/components/contacts/contact-list';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast-context';
import { PaymentMethodFormSheet } from '@/components/wallets/payment-method-form-sheet';
import { PresetQuickAdd } from '@/components/wallets/preset-quick-add';
import { WalletList } from '@/components/wallets/wallet-list';
import { useCreateCounterparty, useCreatePaymentMethod } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { CUSTOM_PRESET_KEY } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type Segment = 'wallets' | 'contacts';

export default function WalletsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('wallets');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [newWalletPreset, setNewWalletPreset] = useState<string | null>(null);
  const [isContactFormVisible, setIsContactFormVisible] = useState(false);
  const createWallet = useCreatePaymentMethod();
  const createContact = useCreateCounterparty();

  const isWallets = segment === 'wallets';

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        <SegmentedControl
          options={[
            { value: 'wallets', label: t('wallets.walletsSegment'), icon: 'wallet-outline' },
            { value: 'contacts', label: t('wallets.contactsSegment'), icon: 'people-outline' },
          ]}
          selected={segment}
          onSelect={setSegment}
        />
        <AppText variant="caption" tone="muted">
          {isWallets ? t('wallets.subtitle') : t('contacts.emptyHint')}
        </AppText>
      </View>
      {isWallets && !debouncedSearch ? <PresetQuickAdd onSelect={setNewWalletPreset} /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: t('wallets.title'),
          headerSearchBarOptions: isAdmin
            ? {
                placeholder: t('wallets.searchPlaceholder'),
                cancelButtonText: t('common.cancel'),
                autoCapitalize: 'none',
                onChangeText: (event) => setSearch(event.nativeEvent.text),
              }
            : undefined,
        }}
      />
      {!isAdmin ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.xl }}>
          <Card>
            <AppText variant="caption" tone="muted">
              {t('wallets.adminOnly')}
            </AppText>
          </Card>
        </ScrollView>
      ) : isWallets ? (
        <WalletList header={header} search={debouncedSearch} />
      ) : (
        <ContactList header={header} search={debouncedSearch} />
      )}

      {isAdmin ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: insets.bottom + spacing.lg }}
        >
          <Button
            variant="glass"
            title={isWallets ? t('wallets.addMethod') : t('contacts.newContact')}
            icon={isWallets ? 'add-circle-outline' : 'person-add-outline'}
            onPress={() => (isWallets ? setNewWalletPreset(CUSTOM_PRESET_KEY) : setIsContactFormVisible(true))}
          />
        </View>
      ) : null}

      <PaymentMethodFormSheet
        visible={newWalletPreset !== null}
        method={null}
        initialPresetKey={newWalletPreset ?? CUSTOM_PRESET_KEY}
        saving={createWallet.isPending}
        onClose={() => setNewWalletPreset(null)}
        onSubmit={async ({ monthlyLimit, ...values }) => {
          await createWallet.mutateAsync({ ...values, monthlyLimit: monthlyLimit ?? undefined });
          setNewWalletPreset(null);
          showToast(t('wallets.added'));
        }}
      />

      <ContactFormSheet
        visible={isContactFormVisible}
        contact={null}
        saving={createContact.isPending}
        onClose={() => setIsContactFormVisible(false)}
        onSubmit={async (input) => {
          await createContact.mutateAsync(input);
          setIsContactFormVisible(false);
          showToast(t('contacts.created'));
        }}
      />
    </View>
  );
}
