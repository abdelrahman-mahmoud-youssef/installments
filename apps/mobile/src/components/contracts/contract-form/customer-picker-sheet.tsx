import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerListItem } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useCustomers } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface CustomerPickerSheetProps {
  visible: boolean;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (customer: CustomerListItem) => void;
  onCreateNew: () => void;
}

export function CustomerPickerSheet({ visible, selectedId, onClose, onSelect, onCreateNew }: CustomerPickerSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useCustomers({ q: debouncedSearch || undefined, status: 'ACTIVE' });
  const customers = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('contractForm.chooseCustomer')}>
      <View style={{ gap: spacing.md }}>
        <TextField
          label={t('common.search')}
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        <Button title={t('customerForm.newTitle')} icon="person-add-outline" variant="secondary" onPress={onCreateNew} />
        {query.isPending ? <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} /> : null}
        {!query.isPending && customers.length === 0 ? (
          <AppText variant="caption" tone="muted" align="center">
            {debouncedSearch ? t('customers.emptySearch') : t('customers.empty')}
          </AppText>
        ) : null}
        {customers.map((customer) => {
          const isSelected = customer.id === selectedId;
          return (
            <PressableScale
              key={customer.id}
              onPress={() => onSelect(customer)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceMuted,
              }}
            >
              <Avatar name={customer.name} photoUrl={customer.photoUrl} size={36} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {customer.name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {customer.phone}
                </AppText>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            </PressableScale>
          );
        })}
        {query.hasNextPage ? (
          <Button
            title={t('common.loadMore')}
            variant="ghost"
            loading={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}
