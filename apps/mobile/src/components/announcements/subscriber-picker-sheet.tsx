import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { useAnnouncementSubscribers } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { SubscriberRow } from './subscriber-row';

const LIST_HEIGHT_RATIO = 0.45;

interface SubscriberPickerSheetProps {
  visible: boolean;
  selectedIds: ReadonlySet<string>;
  onToggle: (subscriberId: string) => void;
  onClose: () => void;
}

export function SubscriberPickerSheet({ visible, selectedIds, onToggle, onClose }: SubscriberPickerSheetProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAnnouncementSubscribers({ q: debouncedSearch || undefined }, visible);

  const subscribers = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('announcements.subscribersTitle')} scrollable={false}>
      <TextField
        label={t('common.search')}
        placeholder={t('announcements.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FlatList
        data={subscribers}
        keyExtractor={(subscriber) => subscriber.id}
        style={{ height: height * LIST_HEIGHT_RATIO }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={2} rows={1} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon="paper-plane-outline"
              title={t('announcements.noSubscribers')}
              message={t('announcements.noSubscribersHint')}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => (
          <SubscriberRow subscriber={item} selected={selectedIds.has(item.id)} onToggle={() => onToggle(item.id)} />
        )}
      />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" tone="muted" align="center">
          {t('announcements.selectedCount', { count: formatNumber(selectedIds.size, locale) })}
        </AppText>
        <Button title={t('announcements.done')} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
