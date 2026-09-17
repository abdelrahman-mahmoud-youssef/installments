import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { PaymentMethod } from '@/api/payment-methods';
import { useAuth } from '@/auth/auth-context';
import { PaymentMethodCard } from '@/components/wallets/payment-method-card';
import { PaymentMethodFormSheet } from '@/components/wallets/payment-method-form-sheet';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListRow } from '@/components/ui/list-row';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import {
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type PendingConfirm = { kind: 'remove' | 'deactivate'; method: PaymentMethod } | null;

export default function WalletsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data, isPending, isError, error, refetch, isRefetching } = usePaymentMethods();
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const [actionMethod, setActionMethod] = useState<PaymentMethod | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const methods = data ?? [];
  const primaryMethodId = useMemo(
    () => methods.find((method) => method.isActive)?.id ?? null,
    [methods],
  );

  const openForm = (method: PaymentMethod) => {
    setActionMethod(null);
    setEditingMethod(method);
    setFormVisible(true);
  };

  const toggleActive = (method: PaymentMethod) => {
    if (method.isActive) {
      setActionMethod(null);
      setPendingConfirm({ kind: 'deactivate', method });
      return;
    }
    setActionMethod(null);
    updateMutation.mutate(
      { id: method.id, input: { isActive: true } },
      { onSuccess: () => showToast(t('wallets.updated')) },
    );
  };

  const confirmPendingAction = () => {
    if (!pendingConfirm) {
      return;
    }
    const { kind, method } = pendingConfirm;
    if (kind === 'remove') {
      deleteMutation.mutate(method.id, {
        onSuccess: () => {
          setPendingConfirm(null);
          showToast(t('wallets.removed'));
        },
        onError: () => {
          setPendingConfirm(null);
          showToast(t('common.genericError'), 'error');
        },
      });
    } else {
      updateMutation.mutate(
        { id: method.id, input: { isActive: false } },
        {
          onSuccess: () => {
            setPendingConfirm(null);
            showToast(t('wallets.updated'));
          },
          onError: () => {
            setPendingConfirm(null);
            showToast(t('common.genericError'), 'error');
          },
        },
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('wallets.title') }} />
      <FlatList
        data={isAdmin ? methods : []}
        keyExtractor={(method) => method.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <AppText variant="caption" tone="muted">
              {t('wallets.subtitle')}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            {!isAdmin ? (
              <Card>
                <AppText variant="caption" tone="muted">
                  {t('wallets.adminOnly')}
                </AppText>
              </Card>
            ) : isPending ? (
              <SkeletonCardList count={4} />
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : (
              <EmptyState icon="wallet-outline" title={t('wallets.empty')} message={t('wallets.emptyHint')} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <PaymentMethodCard
              method={item}
              isPrimary={item.id === primaryMethodId}
              onPress={() => setActionMethod(item)}
            />
          </View>
        )}
      />

      <BottomSheet
        visible={actionMethod !== null}
        onClose={() => setActionMethod(null)}
        title={actionMethod?.label}
        scrollable={false}
      >
        {actionMethod ? (
          <View>
            <ListRow
              icon="create-outline"
              title={t('wallets.editMethod')}
              onPress={() => openForm(actionMethod)}
            />
            <ListRow
              icon={actionMethod.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              title={actionMethod.isActive ? t('wallets.deactivate') : t('wallets.activate')}
              onPress={() => toggleActive(actionMethod)}
            />
            <ListRow
              icon="trash-outline"
              title={t('common.remove')}
              destructive
              onPress={() => {
                setPendingConfirm({ kind: 'remove', method: actionMethod });
                setActionMethod(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <PaymentMethodFormSheet
        visible={formVisible}
        method={editingMethod}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormVisible(false)}
        onCreate={async (input) => {
          await createMutation.mutateAsync(input);
          setFormVisible(false);
          showToast(t('wallets.added'));
        }}
        onUpdate={async (id, input) => {
          await updateMutation.mutateAsync({ id, input });
          setFormVisible(false);
          showToast(t('wallets.updated'));
        }}
      />

      <ConfirmSheet
        visible={pendingConfirm !== null}
        title={pendingConfirm?.kind === 'remove' ? t('wallets.removeTitle') : t('wallets.deactivateTitle')}
        message={
          pendingConfirm
            ? t(
                pendingConfirm.kind === 'remove' ? 'wallets.removeConfirm' : 'wallets.deactivateConfirm',
                { label: pendingConfirm.method.label },
              )
            : ''
        }
        confirmTitle={pendingConfirm?.kind === 'remove' ? t('common.remove') : t('wallets.deactivate')}
        destructive
        loading={deleteMutation.isPending || updateMutation.isPending}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingConfirm(null)}
      />
    </View>
  );
}
