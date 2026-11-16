import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusMessage({
  icon: Icon,
  tone = 'neutral',
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  tone?: 'neutral' | 'danger';
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span
        className={cn(
          'grid size-14 place-items-center rounded-2xl',
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon aria-hidden className="size-6" strokeWidth={1.9} />
      </span>
      <h1 className="mt-6 font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">{description}</p>
      <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">{children}</div>
    </section>
  );
}
