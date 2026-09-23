import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_IMAGE_MAX_MEGABYTES,
  AnnouncementAudience,
} from '@/api/announcements';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { AnnouncementImageField } from '@/components/announcements/announcement-image-field';
import { SubscriberPickerSheet } from '@/components/announcements/subscriber-picker-sheet';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ListRow } from '@/components/ui/list-row';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateAnnouncement } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { AnnouncementDraftError, findAnnouncementDraftError, toCreateAnnouncementInput } from '@/lib/announcement-draft';
import { formatNumber } from '@/lib/format';
import { PickedImage, pickImages } from '@/lib/image-picker';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

export default function NewAnnouncementScreen() {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createMutation = useCreateAnnouncement();
  const [body, setBody] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [draftError, setDraftError] = useState<AnnouncementDraftError | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const draft = { body, imageBase64: image?.base64 ?? null, audience, selectedIds };
  const selectedCountLabel = formatNumber(selectedIds.size, locale);

  const toggleSubscriber = (subscriberId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(subscriberId)) {
        next.add(subscriberId);
      }
      return next;
    });
    setDraftError(null);
  };

  const pickImage = async () => {
    const [picked] = await pickImages({ limit: 1 });
    if (picked) {
      setImage(picked);
      setDraftError(null);
    }
  };

  const requestSend = () => {
    const error = findAnnouncementDraftError(draft);
    setDraftError(error);
    setApiError(null);
    if (!error) {
      setConfirmVisible(true);
    }
  };

  const send = async () => {
    try {
      const created = await createMutation.mutateAsync(toCreateAnnouncementInput(draft));
      setConfirmVisible(false);
      showToast(t('announcements.queued', { count: formatNumber(created.recipientCount, locale) }));
      router.back();
    } catch (caught) {
      setConfirmVisible(false);
      setApiError(caught instanceof ApiError ? caught.message : t('common.genericError'));
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl }}>
        <Stack.Screen options={{ title: t('announcements.composeTitle') }} />
        <Card>
          <AppText variant="caption" tone="muted">
            {t('announcements.adminOnly')}
          </AppText>
        </Card>
      </View>
    );
  }

  const generalError =
    draftError === 'contentRequired' || draftError === 'selectionRequired' ? t(`announcements.${draftError}`) : apiError;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('announcements.composeTitle') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl + floatingActionClearance,
          gap: spacing.xl,
        }}
      >
        <TextField
          label={t('announcements.message')}
          placeholder={t('announcements.messagePlaceholder')}
          value={body}
          onChangeText={(text) => {
            setBody(text);
            setDraftError(null);
          }}
          maxLength={ANNOUNCEMENT_BODY_MAX_LENGTH}
          multiline
        />
        <AnnouncementImageField
          image={image}
          error={
            draftError === 'imageTooLarge'
              ? t('announcements.imageTooLarge', { max: formatNumber(ANNOUNCEMENT_IMAGE_MAX_MEGABYTES, locale) })
              : undefined
          }
          onPick={() => void pickImage()}
          onRemove={() => setImage(null)}
        />
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted">
            {t('announcements.audience')}
          </AppText>
          <SegmentedControl<AnnouncementAudience>
            options={[
              { value: 'ALL', label: t('announcements.audienceAll'), icon: 'people-outline' },
              { value: 'SELECTED', label: t('announcements.audienceSelected'), icon: 'checkmark-done-outline' },
            ]}
            selected={audience}
            onSelect={(value) => {
              setAudience(value);
              setDraftError(null);
              setPickerVisible(value === 'SELECTED');
            }}
          />
          {audience === 'SELECTED' ? (
            <Card>
              <ListRow
                icon="person-add-outline"
                title={t('announcements.chooseSubscribers')}
                subtitle={t('announcements.selectedCount', { count: selectedCountLabel })}
                onPress={() => setPickerVisible(true)}
                showChevron
              />
            </Card>
          ) : null}
        </View>
        {generalError ? (
          <AppText variant="caption" tone="danger">
            {generalError}
          </AppText>
        ) : null}
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: insets.bottom + spacing.lg }}
      >
        <Button variant="glass" title={t('announcements.send')} icon="paper-plane-outline" onPress={requestSend} />
      </View>

      <SubscriberPickerSheet
        visible={pickerVisible}
        selectedIds={selectedIds}
        onToggle={toggleSubscriber}
        onClose={() => setPickerVisible(false)}
      />

      <ConfirmSheet
        visible={confirmVisible}
        title={t('announcements.confirmTitle')}
        message={
          audience === 'ALL'
            ? t('announcements.confirmAll')
            : t('announcements.confirmSelected', { count: selectedCountLabel })
        }
        confirmTitle={t('announcements.send')}
        loading={createMutation.isPending}
        onConfirm={() => void send()}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
