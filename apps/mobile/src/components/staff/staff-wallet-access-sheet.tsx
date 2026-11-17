import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { StaffMember } from '@/api/staff';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SwitchRow } from '@/components/ui/switch-row';
import { useToast } from '@/components/ui/toast-context';
import { WalletIcon } from '@/components/wallets/wallet-icon';
import { usePaymentMethods, useSetStaffWalletAccess } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { maskAccountDetails } from '@/lib/format';
import { resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

type WalletScope = 'ALL' | 'SELECTED';

const WALLET_ICON_SIZE = 28;

interface StaffWalletAccessSheetProps {
  member: StaffMember | null;
  onClose: () => void;
}

export function StaffWalletAccessSheet({ member, onClose }: StaffWalletAccessSheetProps) {
  const { t } = useI18n();
  const { colors, fontSize } = useTheme();
  const { showToast } = useToast();
  const walletsQuery = usePaymentMethods(member !== null);
  const saveMutation = useSetStaffWalletAccess();
  const [canSeeWallets, setCanSeeWallets] = useState(false);
  const [scope, setScope] = useState<WalletScope>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setCanSeeWallets(member.walletAccess !== 'NONE');
      setScope(member.walletAccess === 'SELECTED' ? 'SELECTED' : 'ALL');
      setSelectedIds(member.paymentMethodIds);
      setError(null);
    }
  }, [member]);

  const wallets = walletsQuery.data ?? [];
  const isChoosingWallets = canSeeWallets && scope === 'SELECTED';

  const toggleWallet = (walletId: string) => {
    setError(null);
    setSelectedIds((current) =>
      current.includes(walletId) ? current.filter((id) => id !== walletId) : [...current, walletId],
    );
  };

  const save = async () => {
    if (!member) {
      return;
    }
    if (isChoosingWallets && selectedIds.length === 0) {
      setError(t('staff.chooseWallets'));
      return;
    }
    try {
      await saveMutation.mutateAsync({
        id: member.id,
        input: {
          walletAccess: canSeeWallets ? scope : 'NONE',
          paymentMethodIds: isChoosingWallets ? selectedIds : [],
        },
      });
      onClose();
      showToast(t('staff.walletAccessUpdated'));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.genericError'));
    }
  };

  return (
    <BottomSheet
      visible={member !== null}
      onClose={saveMutation.isPending ? () => undefined : onClose}
      title={member ? t('staff.walletAccessTitle', { name: member.name }) : undefined}
    >
      <View style={{ gap: spacing.lg }}>
        <SwitchRow
          label={t('staff.canSeeWallets')}
          hint={t('staff.canSeeWalletsHint')}
          value={canSeeWallets}
          onValueChange={(value) => {
            setCanSeeWallets(value);
            setError(null);
          }}
        />
        {canSeeWallets ? (
          <SegmentedControl
            options={[
              { value: 'ALL', label: t('staff.walletAccessAll'), icon: 'albums-outline' },
              { value: 'SELECTED', label: t('staff.onlySelectedWallets'), icon: 'checkbox-outline' },
            ]}
            selected={scope}
            onSelect={(value) => {
              setScope(value);
              setError(null);
            }}
          />
        ) : null}
        {isChoosingWallets ? (
          wallets.length === 0 ? (
            <AppText variant="caption" tone="muted">
              {t('staff.noWalletsToChoose')}
            </AppText>
          ) : (
            <View>
              {wallets.map((wallet) => {
                const isSelected = selectedIds.includes(wallet.id);
                return (
                  <ListRow
                    key={wallet.id}
                    title={wallet.label}
                    subtitle={maskAccountDetails(wallet.details)}
                    onPress={() => toggleWallet(wallet.id)}
                    trailing={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <WalletIcon
                          preset={resolvePaymentMethodPreset(wallet.presetKey, wallet.iconKey)}
                          size={WALLET_ICON_SIZE}
                          borderRadius={radius.full}
                        />
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={fontSize('xl')}
                          color={isSelected ? colors.primary : colors.textFaint}
                          accessibilityLabel={isSelected ? t('staff.walletSelected') : t('staff.walletNotSelected')}
                        />
                      </View>
                    }
                  />
                );
              })}
            </View>
          )
        ) : null}
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void save()} loading={saveMutation.isPending} />
      </View>
    </BottomSheet>
  );
}
