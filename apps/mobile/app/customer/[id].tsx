import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerDetail } from '@/api/customers';
import { CustomerContractsSection } from '@/components/customers/customer-contracts-section';
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet';
import { NotificationHistorySheet } from '@/components/customers/notification-history-sheet';
import { ShareLinkSheet } from '@/components/sharing/share-link-sheet';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { ListRow } from '@/components/ui/list-row';
import { PressableScale } from '@/components/ui/pressable-scale';
import { QuickAction } from '@/components/ui/quick-action';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate } from '@/lib/format';
import { whatsappChatUrl } from '@/lib/phone';
import { customerPortalPath } from '@/lib/share-url';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type OpenSheet = 'menu' | 'edit' | 'share' | 'notifications' | 'delete' | null;

const HERO_AVATAR_SIZE = 80;
const ID_IMAGE_SIZE = 96;

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id);
  const deleteCustomer = useDeleteCustomer();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const closeSheet = () => setOpenSheet(null);

  const openNewContract = (customer: CustomerDetail) =>
    router.push({
      pathname: '/contract/new',
      params: { customerId: customer.id, customerName: customer.name, customerPhone: customer.phone },
    });

  const removeCustomer = async () => {
    closeSheet();
    router.back();
    try {
      await deleteCustomer.mutateAsync(id);
      showToast(t('customerActions.deletedToast'));
    } catch {
      showToast(t('common.genericError'), 'error');
    }
  };

  const isActive = data?.status === 'ACTIVE';

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.name ?? '',
          headerRight: data
            ? () => (
                <PressableScale
                  onPress={() => setOpenSheet('menu')}
                  accessibilityRole="button"
                  accessibilityLabel={t('customerActions.moreActions')}
                  hitSlop={spacing.sm}
                >
                  <Ionicons name="ellipsis-horizontal-circle" size={26} color={colors.primary} />
                </PressableScale>
              )
            : undefined,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl + floatingActionClearance }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
      >
        {isPending ? (
          <SkeletonCardList count={3} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data ? (
          <>
            <Card>
              <View style={{ alignItems: 'center', gap: spacing.lg }}>
                <Avatar name={data.name} photoUrl={data.photoUrl} size={HERO_AVATAR_SIZE} />
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <AppText variant="title" align="center">
                    {data.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {data.phone}
                  </AppText>
                  <AppText variant="label" tone="faint">
                    {t('customers.memberSince', { date: formatDate(data.createdAt, locale) })}
                  </AppText>
                </View>
                {!isActive ? <Badge label={t('customerActions.deleted')} tone="neutral" /> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
                  <QuickAction
                    icon="call"
                    label={t('customers.call')}
                    onPress={() => void Linking.openURL(`tel:${data.phone}`)}
                  />
                  <QuickAction
                    icon="logo-whatsapp"
                    label={t('customerActions.whatsapp')}
                    onPress={() => void Linking.openURL(whatsappChatUrl(data.phone))}
                  />
                  <QuickAction icon="qr-code-outline" label={t('contacts.share')} onPress={() => setOpenSheet('share')} />
                  <QuickAction icon="create-outline" label={t('contacts.edit')} onPress={() => setOpenSheet('edit')} />
                </View>
              </View>
            </Card>

            {data.address || data.notes ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={t('customers.infoSection')} />
                <Card>
                  <View style={{ gap: spacing.md }}>
                    {data.address ? (
                      <View style={{ gap: 2 }}>
                        <AppText variant="label" tone="muted">
                          {t('customers.address')}
                        </AppText>
                        <AppText variant="caption">{data.address}</AppText>
                      </View>
                    ) : null}
                    {data.notes ? (
                      <View style={{ gap: 2 }}>
                        <AppText variant="label" tone="muted">
                          {t('customers.notes')}
                        </AppText>
                        <AppText variant="caption">{data.notes}</AppText>
                      </View>
                    ) : null}
                  </View>
                </Card>
              </View>
            ) : null}

            {data.idImageFrontUrl || data.idImageBackUrl ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={t('customerActions.idSection')} />
                <Card>
                  <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                    {data.idImageFrontUrl ? (
                      <ImageThumbnail path={data.idImageFrontUrl} label={t('customerForm.idFront')} size={ID_IMAGE_SIZE} />
                    ) : null}
                    {data.idImageBackUrl ? (
                      <ImageThumbnail path={data.idImageBackUrl} label={t('customerForm.idBack')} size={ID_IMAGE_SIZE} />
                    ) : null}
                  </View>
                </Card>
              </View>
            ) : null}

            <CustomerContractsSection contracts={data.contracts} onNewContract={() => openNewContract(data)} />
          </>
        ) : null}
      </ScrollView>

      {data && isActive ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('contractForm.title')}
            icon="add-circle-outline"
            onPress={() => openNewContract(data)}
          />
        </FloatingActionBar>
      ) : null}

      {data ? (
        <>
          <BottomSheet visible={openSheet === 'menu'} onClose={closeSheet} title={data.name} scrollable={false}>
            <View>
              <ListRow icon="create-outline" title={t('customerForm.editTitle')} onPress={() => setOpenSheet('edit')} />
              <ListRow icon="qr-code-outline" title={t('sharing.shareCustomerLink')} onPress={() => setOpenSheet('share')} />
              <ListRow
                icon="notifications-outline"
                title={t('customerActions.notificationHistory')}
                onPress={() => setOpenSheet('notifications')}
              />
              {isActive ? (
                <ListRow
                  icon="trash-outline"
                  title={t('customerActions.delete')}
                  destructive
                  onPress={() => setOpenSheet('delete')}
                />
              ) : null}
            </View>
          </BottomSheet>
          <CustomerFormSheet
            visible={openSheet === 'edit'}
            customer={data}
            saving={updateCustomer.isPending}
            onClose={closeSheet}
            onSubmit={async (input) => {
              await updateCustomer.mutateAsync(input);
              closeSheet();
              showToast(t('customerForm.updated'));
            }}
          />
          <ShareLinkSheet
            visible={openSheet === 'share'}
            onClose={closeSheet}
            title={t('sharing.shareCustomerLink')}
            targetPath={customerPortalPath(data.publicId)}
            whatsappPhone={data.phone}
          />
          <NotificationHistorySheet visible={openSheet === 'notifications'} customerId={data.id} onClose={closeSheet} />
          <ConfirmSheet
            visible={openSheet === 'delete'}
            title={t('customerActions.deleteTitle')}
            message={t('customerActions.deleteConfirm', { name: data.name })}
            confirmTitle={t('customerActions.delete')}
            destructive
            loading={deleteCustomer.isPending}
            onConfirm={() => void removeCustomer()}
            onCancel={closeSheet}
          />
        </>
      ) : null}
    </>
  );
}
