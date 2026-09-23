import { useState } from 'react';
import { View } from 'react-native';
import { PaymentMethod } from '@/api/payment-methods';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ListRow } from '@/components/ui/list-row';
import { useToast } from '@/components/ui/toast-context';
import { useDeletePaymentMethod, useUpdatePaymentMethod } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { PaymentMethodFormSheet } from './payment-method-form-sheet';

type PendingConfirm = { kind: 'remove' | 'deactivate'; method: PaymentMethod } | null;

interface WalletActionsProps {
  method: PaymentMethod | null;
  onClose: () => void;
  onRemoved?: () => void;
}

export function WalletActions({ method, onClose, onRemoved }: WalletActionsProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const showError = () => showToast(t('common.genericError'), 'error');

  const toggleActive = (target: PaymentMethod) => {
    onClose();
    if (target.isActive) {
      setPendingConfirm({ kind: 'deactivate', method: target });
      return;
    }
    updateMutation.mutate(
      { id: target.id, input: { isActive: true } },
      { onSuccess: () => showToast(t('wallets.updated')), onError: showError },
    );
  };

  const removeMethod = async (target: PaymentMethod) => {
    setPendingConfirm(null);
    onRemoved?.();
    try {
      await deleteMutation.mutateAsync(target.id);
      showToast(t('wallets.removed'));
    } catch {
      showError();
    }
  };

  const deactivateMethod = async (target: PaymentMethod) => {
    try {
      await updateMutation.mutateAsync({ id: target.id, input: { isActive: false } });
      showToast(t('wallets.updated'));
    } catch {
      showError();
    } finally {
      setPendingConfirm(null);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingConfirm) {
      return;
    }
    const action = pendingConfirm.kind === 'remove' ? removeMethod : deactivateMethod;
    void action(pendingConfirm.method);
  };

  return (
    <>
      <BottomSheet visible={method !== null} onClose={onClose} title={method?.label} scrollable={false}>
        {method ? (
          <View>
            <ListRow
              icon="create-outline"
              title={t('wallets.editMethod')}
              onPress={() => {
                onClose();
                setEditingMethod(method);
              }}
            />
            <ListRow
              icon={method.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              title={method.isActive ? t('wallets.deactivate') : t('wallets.activate')}
              onPress={() => toggleActive(method)}
            />
            <ListRow
              icon="trash-outline"
              title={t('common.remove')}
              destructive
              onPress={() => {
                onClose();
                setPendingConfirm({ kind: 'remove', method });
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <PaymentMethodFormSheet
        visible={editingMethod !== null}
        method={editingMethod}
        saving={updateMutation.isPending}
        onClose={() => setEditingMethod(null)}
        onSubmit={async ({ label, details, monthlyLimit }) => {
          if (!editingMethod) {
            return;
          }
          await updateMutation.mutateAsync({ id: editingMethod.id, input: { label, details, monthlyLimit } });
          setEditingMethod(null);
          showToast(t('wallets.updated'));
        }}
      />

      <ConfirmSheet
        visible={pendingConfirm !== null}
        title={pendingConfirm?.kind === 'remove' ? t('wallets.removeTitle') : t('wallets.deactivateTitle')}
        message={
          pendingConfirm
            ? t(pendingConfirm.kind === 'remove' ? 'wallets.removeConfirm' : 'wallets.deactivateConfirm', {
                label: pendingConfirm.method.label,
              })
            : ''
        }
        confirmTitle={pendingConfirm?.kind === 'remove' ? t('common.remove') : t('wallets.deactivate')}
        destructive
        loading={deleteMutation.isPending || updateMutation.isPending}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingConfirm(null)}
      />
    </>
  );
}
