'use client';

import { useTranslations } from 'next-intl';
import { usePlatformSupportAwaitingReplyCount } from '@/hooks/use-platform-support';
import { Link, usePathname } from '@/i18n/navigation';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

function NavLink({ href, label, badge }: { href: string; label: string; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
        isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {label}
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function PlatformNav() {
  const t = useTranslations('platform.nav');
  const { data: awaitingReply } = usePlatformSupportAwaitingReplyCount();

  return (
    <nav className="flex items-center gap-1">
      <NavLink href={routes.platform} label={t('shops')} />
      <NavLink href={routes.platformSupport} label={t('support')} badge={awaitingReply?.count} />
    </nav>
  );
}
