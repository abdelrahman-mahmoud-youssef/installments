import { Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { StaffMember } from '@/api/staff';
import { StaffCard } from '@/components/staff/staff-card';
import { StaffFormSheet } from '@/components/staff/staff-form-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { useSetStaffActive, useStaff } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function StaffScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { data, isPending, isError, error, refetch, isRefetching } = useStaff();
  const toggleMutation = useSetStaffActive();
  const [formVisible, setFormVisible] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState<StaffMember | null>(null);

  const setActive = (member: StaffMember, isActive: boolean) => {
    toggleMutation.mutate(
      { id: member.id, isActive },
      {
        onSuccess: () => showToast(t('staff.statusUpdated')),
        onError: () => showToast(t('common.genericError'), 'error'),
        onSettled: () => setPendingDeactivation(null),
      },
    );
  };

  const requestToggle = (member: StaffMember, isActive: boolean) => {
    if (isActive) {
      setActive(member, true);
      return;
    }
    setPendingDeactivation(member);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('staff.title') }} />
      <FlatList
        data={data ?? []}
        keyExtractor={(member) => member.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          <Button title={t('staff.addStaff')} icon="person-add-outline" onPress={() => setFormVisible(true)} />
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={3} rows={1} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState icon="people-outline" title={t('staff.empty')} message={t('staff.emptyHint')} />
          )
        }
        renderItem={({ item }) => (
          <StaffCard
            member={item}
            disabled={toggleMutation.isPending}
            onToggleActive={(isActive) => requestToggle(item, isActive)}
          />
        )}
      />

      <StaffFormSheet visible={formVisible} onClose={() => setFormVisible(false)} />

      <ConfirmSheet
        visible={pendingDeactivation !== null}
        title={t('staff.deactivateTitle')}
        message={pendingDeactivation ? t('staff.deactivateConfirm', { name: pendingDeactivation.name }) : ''}
        confirmTitle={t('staff.deactivate')}
        destructive
        loading={toggleMutation.isPending}
        onConfirm={() => {
          if (pendingDeactivation) {
            setActive(pendingDeactivation, false);
          }
        }}
        onCancel={() => setPendingDeactivation(null)}
      />
    </View>
  );
}
