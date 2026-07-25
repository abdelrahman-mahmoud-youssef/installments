import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 py-10 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-7" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          This link is invalid or no longer available.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[0.9375rem] font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
      >
        Back home
      </Link>
    </div>
  );
}
