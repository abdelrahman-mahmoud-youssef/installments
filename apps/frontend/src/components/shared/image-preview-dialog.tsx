'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ImagePreviewDialog({
  trigger,
  src,
  alt,
}: {
  trigger: React.ReactElement;
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <img src={src} alt={alt} className="max-h-[70vh] w-full rounded-lg object-contain" />
      </DialogContent>
    </Dialog>
  );
}
