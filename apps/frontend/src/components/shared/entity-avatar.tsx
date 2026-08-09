import { InitialAvatar } from '@/components/shared/initial-avatar';
import { resolveAssetUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';

export function EntityAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null | undefined;
  className?: string;
}) {
  if (!photoUrl) {
    return <InitialAvatar name={name} className={className} />;
  }

  return (
    <img
      src={resolveAssetUrl(photoUrl) ?? undefined}
      alt={name}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  );
}
