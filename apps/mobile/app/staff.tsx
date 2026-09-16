import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Switch, View } from 'react-native';
import { ApiError } from '@/api/client';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateStaff, useSetStaffActive, useStaff } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function StaffScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { data, isPending, isError, error, refetch, isRefetching } = useStaff();
  const createMutation = useCreateStaff();
  const toggleMutation = useSetStaffActive();

  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (formVisible) {
      setName('');
      setEmail('');
      setPassword('');
      setFormError(null);
    }
  }, [formVisible]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setFormError(t('common.requiredField'));
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setFormVisible(false);
      showToast(t('staff.added'));
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : t('common.genericError'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('staff.title') }} />
      <FlatList
        data={data ?? []}
        keyExtractor={(member) => member.id}
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
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar name={item.name} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {item.email}
                </AppText>
              </View>
              <Switch
                value={item.isActive}
                onValueChange={(isActive) =>
                  toggleMutation.mutate({ id: item.id, isActive }, {
                    onError: () => showToast(t('common.genericError'), 'error'),
                  })
                }
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
          </Card>
        )}
      />

      <BottomSheet visible={formVisible} onClose={() => setFormVisible(false)} title={t('staff.addStaff')}>
        <View style={{ gap: spacing.lg }}>
          <TextField label={t('staff.name')} value={name} onChangeText={setName} />
          <TextField
            label={t('staff.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label={t('staff.password')} value={password} onChangeText={setPassword} secureToggle />
          {formError ? (
            <AppText variant="caption" tone="danger">
              {formError}
            </AppText>
          ) : null}
          <Button title={t('common.save')} onPress={() => void submit()} loading={createMutation.isPending} />
        </View>
      </BottomSheet>
    </View>
  );
}
