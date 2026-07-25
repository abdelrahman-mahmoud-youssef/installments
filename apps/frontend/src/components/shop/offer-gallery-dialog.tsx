'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function OfferGalleryDialog({
  open,
  onOpenChange,
  title,
  images,
  initialIndex = 0,
  counterLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  images: string[];
  initialIndex?: number;
  counterLabel: (current: number, total: number) => string;
}) {
  // The dialog unmounts on close, so this always re-initializes fresh on open.
  const [index, setIndex] = useState(initialIndex);

  function goTo(next: number) {
    setIndex((next + images.length) % images.length);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-xl">
        <DialogTitle className="truncate pe-8">{title}</DialogTitle>
        <div className="relative overflow-hidden rounded-lg bg-muted">
          <img
            src={images[index]}
            alt={title}
            className="aspect-4/3 w-full object-cover"
          />
          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                onClick={() => goTo(index - 1)}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                onClick={() => goTo(index + 1)}
              >
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
              <span className="absolute bottom-2 end-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {counterLabel(index + 1, images.length)}
              </span>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                type="button"
                key={src}
                onClick={() => setIndex(i)}
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-md ring-2 ring-transparent transition-all',
                  i === index && 'ring-primary',
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
