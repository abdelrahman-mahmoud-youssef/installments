import { InitialAvatar } from '@/components/shared/initial-avatar';
import { resolveAssetUrl, thumbnailUrl } from '@/lib/assets';
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
  const photoSource = resolveAssetUrl(photoUrl ?? null);
  if (!photoSource) {
    return <InitialAvatar name={name} className={className} />;
  }

  return (
    <img loading="lazy" decoding="async"
      src={thumbnailUrl(photoSource, 200)}
      alt={name}
      className={cn('shrink-0 rounded-full object-cover', className)}
    />
  );
}
