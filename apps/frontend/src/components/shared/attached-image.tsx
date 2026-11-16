import { ImagePreviewDialog } from '@/components/shared/image-preview-dialog';
import { resolveAssetUrl } from '@/lib/assets';

export function AttachedImage({ path, alt }: { path: string; alt: string }) {
  const src = resolveAssetUrl(path) ?? '';

  return (
    <ImagePreviewDialog
      src={src}
      alt={alt}
      trigger={
        <button type="button" className="block w-fit">
          <img loading="lazy" decoding="async" src={src} alt={alt} className="h-24 rounded-lg border border-border object-cover" />
        </button>
      }
    />
  );
}
