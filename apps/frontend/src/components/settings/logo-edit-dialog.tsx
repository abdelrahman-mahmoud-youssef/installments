'use client';

import { Eraser, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCroppedImageDataUrl } from '@/lib/image-crop';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LogoEditDialogContent({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: File;
  onOpenChange: (open: boolean) => void;
  onConfirm: (base64: string) => Promise<void>;
}) {
  const t = useTranslations('settings');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readFileAsDataUrl(file).then((dataUrl) => {
      if (!cancelled) {
        setImageSrc(dataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  async function handleRemoveBackground() {
    setIsRemovingBackground(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(imageSrc as string);
      setImageSrc(URL.createObjectURL(blob));
    } catch {
      toast.error(t('logoRemoveBackgroundError'));
    } finally {
      setIsRemovingBackground(false);
    }
  }

  async function handleSave() {
    if (!croppedAreaPixels || !imageSrc) {
      return;
    }
    setIsSaving(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      await onConfirm(dataUrl.split(',')[1]);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUseOriginal() {
    setIsSaving(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await onConfirm(dataUrl.split(',')[1]);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isRemovingBackground || isSaving;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('logoEditTitle')}</DialogTitle>
          <DialogDescription>{t('logoEditDescription')}</DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <>
            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-primary"
              aria-label="Zoom"
            />

            <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={handleRemoveBackground}>
              {isRemovingBackground ? <Loader2 className="size-4 animate-spin" /> : <Eraser className="size-4" />}
              {isRemovingBackground ? t('logoRemovingBackground') : t('logoRemoveBackground')}
            </Button>
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isBusy} onClick={handleUseOriginal}>
            {t('logoUseOriginal')}
          </Button>
          <Button type="button" disabled={isBusy || !imageSrc} onClick={handleSave}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {t('logoSaveEdit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogoEditDialog({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (base64: string) => Promise<void>;
}) {
  if (!file) {
    return null;
  }
  return (
    <LogoEditDialogContent
      key={`${file.name}-${file.size}-${file.lastModified}`}
      file={file}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
