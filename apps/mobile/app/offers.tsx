import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Offer } from '@/api/offers';
import { useAuth } from '@/auth/auth-context';
import { OfferCard } from '@/components/offers/offer-card';
import { OfferFormSheet } from '@/components/offers/offer-form-sheet';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListRow } from '@/components/ui/list-row';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import {
  useBranding,
  useCreateOffer,
  useDeleteOffer,
  useOffers,
  useSetOffersVisibility,
  useUpdateOffer,
} from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

const GRID_COLUMNS = 2;

export default function OffersScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [actionOffer, setActionOffer] = useState<Offer | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Offer | null>(null);

  const query = useOffers({ q: debouncedSearch.trim() || undefined }, isAdmin);
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;
  const branding = useBranding(isAdmin);
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const deleteMutation = useDeleteOffer();
  const visibilityMutation = useSetOffersVisibility();

  const offers = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const showOnShop = branding.data?.showOffersOnPublicPage ?? true;

  const openForm = (offer: Offer | null) => {
    setActionOffer(null);
    setEditingOffer(offer);
    setFormVisible(true);
  };

  const toggleOfferActive = (offer: Offer) => {
    setActionOffer(null);
    updateMutation.mutate(
      { id: offer.id, input: { isActive: !offer.isActive } },
      {
        onSuccess: () => showToast(t('offers.updated')),
        onError: () => showToast(t('common.genericError'), 'error'),
      },
    );
  };

  const confirmRemove = () => {
    if (!pendingRemove) {
      return;
    }
    deleteMutation.mutate(pendingRemove.id, {
      onSuccess: () => {
        setPendingRemove(null);
        showToast(t('offers.removed'));
      },
      onError: () => {
        setPendingRemove(null);
        showToast(t('common.genericError'), 'error');
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: t('offers.title'),
          headerSearchBarOptions: isAdmin
            ? {
                placeholder: t('offers.searchPlaceholder'),
                cancelButtonText: t('common.cancel'),
                autoCapitalize: 'none',
                onChangeText: (event) => setSearch(event.nativeEvent.text),
              }
            : undefined,
        }}
      />
      <FlatList
        data={isAdmin ? offers : []}
        keyExtractor={(offer) => offer.id}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: spacing.md }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl + floatingActionClearance,
          gap: spacing.md,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          isAdmin ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">{t('offers.showOnShop')}</AppText>
                  <AppText variant="caption" tone="muted">
                    {t('offers.showOnShopHint')}
                  </AppText>
                </View>
                <Switch
                  value={showOnShop}
                  disabled={branding.isPending || visibilityMutation.isPending}
                  onValueChange={(value) =>
                    visibilityMutation.mutate(value, {
                      onError: () => showToast(t('common.genericError'), 'error'),
                    })
                  }
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.surface}
                />
              </View>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          !isAdmin ? (
            <Card>
              <AppText variant="caption" tone="muted">
                {t('offers.adminOnly')}
              </AppText>
            </Card>
          ) : isPending ? (
            <SkeletonCardList count={3} rows={2} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : debouncedSearch.trim() ? (
            <EmptyState icon="search-outline" title={t('offers.emptySearch')} />
          ) : (
            <EmptyState icon="pricetags-outline" title={t('offers.empty')} message={t('offers.emptyHint')} />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => <OfferCard offer={item} onPress={() => setActionOffer(item)} />}
      />

      {isAdmin ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: insets.bottom + spacing.lg }}
        >
          <Button variant="glass" title={t('offers.newOffer')} icon="add-circle-outline" onPress={() => openForm(null)} />
        </View>
      ) : null}

      <BottomSheet
        visible={actionOffer !== null}
        onClose={() => setActionOffer(null)}
        title={actionOffer?.title}
        scrollable={false}
      >
        {actionOffer ? (
          <View>
            <ListRow icon="create-outline" title={t('offers.editOffer')} onPress={() => openForm(actionOffer)} />
            <ListRow
              icon={actionOffer.isActive ? 'eye-off-outline' : 'eye-outline'}
              title={actionOffer.isActive ? t('offers.hide') : t('offers.show')}
              onPress={() => toggleOfferActive(actionOffer)}
            />
            <ListRow
              icon="trash-outline"
              title={t('common.remove')}
              destructive
              onPress={() => {
                setPendingRemove(actionOffer);
                setActionOffer(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <OfferFormSheet
        visible={formVisible}
        offer={editingOffer}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (input) => {
          if (editingOffer) {
            await updateMutation.mutateAsync({ id: editingOffer.id, input });
            showToast(t('offers.updated'));
          } else {
            await createMutation.mutateAsync(input);
            showToast(t('offers.created'));
          }
          setFormVisible(false);
        }}
      />

      <ConfirmSheet
        visible={pendingRemove !== null}
        title={t('offers.removeTitle')}
        message={pendingRemove ? t('offers.removeConfirm', { title: pendingRemove.title }) : ''}
        confirmTitle={t('common.remove')}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </View>
  );
}
