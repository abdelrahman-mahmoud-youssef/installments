'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CopyableValue({
  label,
  value,
  copyLabel,
  copiedMessage,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedMessage: string;
}) {
  function handleCopy() {
    void navigator.clipboard.writeText(value);
    toast.success(copiedMessage);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 ring-1 ring-border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p dir="ltr" className="truncate text-start font-mono text-sm font-medium">
          {value}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopy} aria-label={copyLabel}>
        <Copy className="size-4" />
      </Button>
    </div>
  );
}
