'use client';

import { useTranslations } from 'next-intl';
import { AttachedImage } from '@/components/shared/attached-image';
import { Badge } from '@/components/ui/badge';
import { PlatformSupportMessage } from '@/hooks/use-platform-support';
import { formatDateTime } from '@/lib/format';
import { SupportReplyDialog } from './support-reply-dialog';

export function PlatformSupportMessageCard({ message }: { message: PlatformSupportMessage }) {
  const t = useTranslations('platform.support');

  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">
            {message.tenant.name}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              <span dir="ltr">{message.tenant.slug}</span>
            </span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {message.sender.name} · <span dir="ltr">{message.sender.email}</span> ·{' '}
            {formatDateTime(message.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={message.adminReply ? 'secondary' : 'default'}>
            {message.adminReply ? t('replied') : t('awaitingReply')}
          </Badge>
          <SupportReplyDialog message={message} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{message.subject}</p>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{message.message}</p>
      </div>
      {message.imageUrl && <AttachedImage path={message.imageUrl} alt={t('attachedImage')} />}
      {message.adminReply && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-foreground">{t('yourReply')}</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{message.adminReply}</p>
          {message.repliedAt && (
            <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(message.repliedAt)}</p>
          )}
        </div>
      )}
    </article>
  );
}
