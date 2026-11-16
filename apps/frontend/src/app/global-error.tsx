'use client';

import { ServerCrash } from 'lucide-react';
import { useEffect } from 'react';
import { buttonVariants } from '@/components/ui/button';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 py-10 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
            <ServerCrash aria-hidden className="size-6" strokeWidth={1.9} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Something went wrong / حصل خطأ</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              The app ran into a server error. Please reload the page.
              <br />
              التطبيق واجه خطأ في السيرفر. جرّب تحمّل الصفحة تاني.
            </p>
          </div>
          <button onClick={reset} className={buttonVariants({ size: 'xl' })}>
            Reload / تحميل تاني
          </button>
        </div>
      </body>
    </html>
  );
}
