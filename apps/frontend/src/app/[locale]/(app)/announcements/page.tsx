'use client';

import { ImagePlus, Megaphone, Send, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useBroadcasts,
  useCreateBroadcast,
  useSubscribers,
} from '@/hooks/use-announcements';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api/client';
import type { BroadcastAudience } from '@/lib/api/announcements';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function AnnouncementsPage() {
  const t = useTranslations('announcements');
  const tCommon = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: currentUser } = useCurrentUser();
  const canCompose = currentUser?.role === 'ADMIN';

  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audience, setAudience] = useState<BroadcastAudience>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [subSearch, setSubSearch] = useState('');
  const [subPage, setSubPage] = useState(1);
  const debouncedSubSearch = useDebouncedValue(subSearch, 300);
  const subscribers = useSubscribers({ q: debouncedSubSearch || undefined, page: subPage, limit: 20 });

  const [histPage, setHistPage] = useState(1);
  const history = useBroadcasts({ page: histPage, limit: 10 });

  const createBroadcast = useCreateBroadcast();

  const canSend =
    (body.trim().length > 0 || image !== null) &&
    (audience === 'ALL' || selectedIds.size > 0) &&
    !createBroadcast.isPending;

  function onImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t('imageTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImage(result.split(',')[1] ?? null);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(null);
    setImagePreview(null);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSend() {
    try {
      const result = await createBroadcast.mutateAsync({
        body: body.trim(),
        image: image ?? undefined,
        audience,
        customerIds: audience === 'SELECTED' ? Array.from(selectedIds) : undefined,
      });
      toast.success(t('queued', { count: result.recipientCount }));
      setBody('');
      removeImage();
      setSelectedIds(new Set());
      setAudience('ALL');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-6">
        {canCompose && (
        <Section title={t('composeTitle')} description={t('composeDescription')}>
          <div className="flex flex-col gap-4">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder={t('messagePlaceholder')}
            />

            {imagePreview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt=""
                  className="size-16 rounded-lg border border-border object-cover"
                />
                <Button variant="outline" size="sm" onClick={removeImage}>
                  <X className="size-4" />
                  {t('imageRemove')}
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={onImageSelected}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="size-4" />
                  {t('imageAdd')}
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                {(['ALL', 'SELECTED'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAudience(value)}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      audience === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {value === 'ALL' ? t('audienceAll') : t('audienceSelected')}
                  </button>
                ))}
              </div>

              <ConfirmDialog
                trigger={
                  <Button disabled={!canSend}>
                    <Send className="size-4" />
                    {t('send')}
                  </Button>
                }
                title={t('confirmTitle')}
                description={
                  audience === 'ALL'
                    ? t('confirmAll')
                    : t('confirmSelected', { count: selectedIds.size })
                }
                confirmLabel={t('send')}
                onConfirm={handleSend}
              />
            </div>

            {audience === 'SELECTED' && (
              <p className="text-xs text-muted-foreground">{t('selectedCount', { count: selectedIds.size })}</p>
            )}
          </div>
        </Section>
        )}

        <Section
          title={t('subscribersTitle')}
          description={t('subscribersDescription')}
          action={
            <SearchInput
              value={subSearch}
              onChange={(value) => {
                setSubSearch(value);
                setSubPage(1);
              }}
              placeholder={t('searchPlaceholder')}
              className="w-48"
            />
          }
        >
          {subscribers.isLoading ? (
            <p className="py-2 text-sm text-muted-foreground">{tCommon('loading')}</p>
          ) : subscribers.data && subscribers.data.data.length > 0 ? (
            <div className="space-y-4">
              <ul className="divide-y divide-border">
                {subscribers.data.data.map((subscriber) => (
                  <li key={subscriber.id} className="flex items-center gap-3 py-3">
                    {audience === 'SELECTED' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(subscriber.id)}
                        onChange={() => toggleSelected(subscriber.id)}
                        disabled={!subscriber.telegramBroadcastsEnabled}
                        className="size-4 accent-primary"
                        aria-label={subscriber.name}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{subscriber.name}</span>
                    {!subscriber.telegramBroadcastsEnabled && (
                      <Badge variant="outline">{t('optedOut')}</Badge>
                    )}
                  </li>
                ))}
              </ul>
              <PaginationControls
                page={subscribers.data.page}
                totalPages={subscribers.data.totalPages}
                onPageChange={setSubPage}
              />
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t('noSubscribers')}
              description={t('noSubscribersHint')}
            />
          )}
        </Section>

        <Section title={t('historyTitle')}>
          {history.isLoading ? (
            <p className="py-2 text-sm text-muted-foreground">{tCommon('loading')}</p>
          ) : history.data && history.data.data.length > 0 ? (
            <div className="space-y-4">
              <ul className="divide-y divide-border">
                {history.data.data.map((broadcast) => (
                  <li key={broadcast.id} className="flex flex-col gap-1.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground">
                        {broadcast.body || (broadcast.hasImage ? t('imageOnly') : '—')}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(broadcast.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={broadcast.status === 'DONE' ? 'secondary' : 'outline'}>
                        {t(`status_${broadcast.status}`)}
                      </Badge>
                      {broadcast.hasImage && <Badge variant="outline">{t('withImage')}</Badge>}
                      <span>{t('sentCount', { sent: broadcast.counts.sent, total: broadcast.counts.total })}</span>
                      {broadcast.counts.failed > 0 && (
                        <span className="text-danger">{t('failedCount', { count: broadcast.counts.failed })}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <PaginationControls
                page={history.data.page}
                totalPages={history.data.totalPages}
                onPageChange={setHistPage}
              />
            </div>
          ) : (
            <EmptyState icon={Megaphone} title={t('noHistory')} />
          )}
        </Section>
      </FadeIn>
    </div>
  );
}
